/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */


const logger = require('./logger');
const ValidationError = require('./error/ValidationError');
const ajv = require('./schema');
const algosdk = require('algosdk');
const _ = require('lodash');
const ee = require('./events');
const AlgodexClient = require('./order/http/AlgodexClient');
const ExplorerClient = require('./http/clients/ExplorerClient');
const IndexerClient = require('./http/clients/IndexerClient');
const structure = require('./order/structure');
const constants = require('./constants');
const compile = require('./order/compile/compile');


/**
 * ## [⚡ Wallet Event](#event:WalletEvent)
 * Fires during wallet operations
 *
 * @event AlgodexApi#WalletEvent
 * @type {Object}
 * @property {string} type Type of Event
 * @property {Wallet} wallet Wallet Data
 */

/**
 * ## [⚡ Order Event](#event:OrderEvent)
 * Fires during order operations
 *
 * @event AlgodexApi#OrderEvent
 * @type {Object}
 * @property {string} type Type of Event
 * @property {Order} asset Order Data
 */

/**
 * Setter Options
 * @typedef {Object} SetterOptions
 * @property {boolean} validate Enable validation
 * @ignore
 */

/**
 * Composed Promises
 * @ignore
 * @param {function} functions
 * @return {function(*): *}
 */
function composePromise(...functions) {
  return (initialValue) =>
    functions.reduceRight(
        (sum, fn) => Promise.resolve(sum).then(fn),
        initialValue,
    );
}
/**
 * Check for a validation flag in options
 *
 * @param {SetterOptions} options Setter Options
 * @return {boolean}
 * @private
 */
function _hasValidateOption(options) {
  return (
    typeof options !== 'undefined' &&
    typeof options.validate !== 'undefined' &&
    options.validate
  );
}

/**
 *
 * @param {*} data
 * @param {*} key
 * @param {*} options
 * @return {ValidationError}
 * @private
 */
function _getValidationError(data, key, options) {
  if (_hasValidateOption(options)) {
    const validate = ajv.getSchema(key);
    // Validate basic type errors
    if (!validate(data)) {
      // algodex.setAsset Validation Error
      return new ValidationError(validate.errors);
    }
  }
}
/**
 *
 * @param {Object} data Data to validate
 * @param {*} key
 * @param {*} initialized
 * @param {*} options
 * @return {ValidationError|Error}
 * @private
 */
function _getSetterError(data, {key, initialized=false, options}={}) {
  if (!initialized) {
    return new Error('Algodex not initialized, run setConfig');
  }
  return _getValidationError(data, key, options);
}

/**
 *
 * @param {Array<Wallet>} current Current Addresses
 * @param {Array<Wallet>} addresses New Addresses
 * @return {*}
 * @private
 */
function _filterExistingWallets(current, addresses) {
  if (!Array.isArray(current)) {
    throw new TypeError('Must be an array of current addresses');
  }
  if (!Array.isArray(addresses)) {
    throw new TypeError('Must be an array of addresses');
  }
  const lookup = current.map((addr)=>addr.address);

  return addresses.filter((w)=>!lookup.includes(w.address));
}

const _sendTransactions = async (client, signedTransactions) => {
  const sentRawTxnIdArr = [];

  for (const group of signedTransactions) {
    logger.debug(`Sending ${group.length} Group Transactions`);
    const rawTxns = group.map((txn) => txn.blob);
    try {
      const {txId} = await client.sendRawTransaction(rawTxns).do();
      sentRawTxnIdArr.push(txId);
    } catch (e) {
      console.log(e);
    }
  }

  await Promise.all(sentRawTxnIdArr.map((txId) => algosdk.waitForConfirmation(client, txId, 10 )));
};
/**
 * # 📦 AlgodexAPI
 *
 * The API requires several services to operate. These include but are not
 * limited to {@link ExplorerClient}, {@link Algodv2}, {@link Indexer}, and
 * {@link AlgodexClient}. This constructor allows for easy use of the underlying
 * smart contract {@link teal}.
 *
 * See [setWallet](#setWallet) and [placeOrder](#placeOrder) for more details
 *
 *
 * @example
 * // Create the API
 * const config = require('./config.js')
 * const api = new AlgodexAPI({config})
 *
 * // Configure Wallet
 * await api.setWallet({
 *   address: "TESTWALLET",
 *   type: "my-algo-wallet",
 *   connector: MyAlgoWallet
 * })
 *
 * // Placing an Order
 * await api.placeOrder({
 *   type: "buy",
 *   amount: 100,
 *   asset: {id: 123456}
 * })
 *
 * @param {APIProperties} props API Constructor Properties
 * @throws {Errors.ValidationError}
 * @constructor
 */
function AlgodexApi(props = {}) {
  const {config, asset, wallet} = props;
  this.emit = ee.emit;
  this.on = ee.on;

  this.type = 'API';
  const validate = ajv.getSchema('APIProperties');

  // Validate Parameters
  if (!validate({type: this.type, wallet, asset, config})) {
    // Failed to Construct Algodex()
    throw new ValidationError(validate.errors);
  }

  // Initialization Flag
  this.isInitialized = false;
  this.addresses = [];
  // Initialize the instance, skip validation
  const options = {validate: false};
  if (typeof config !== 'undefined') this.setConfig(config, options);
  if (typeof wallet !== 'undefined') this.setWallet(wallet, options);
  if (typeof asset !== 'undefined') this.setAsset(asset, options);
}

// Prototypes
AlgodexApi.prototype = {
  /**
   * getAppId
   *
   * Fetches the application ID for the current order
   *
   * @param {Order} order The User Order
   * @return {number}
   */
  async getAppId(order) {
    const result = await this.algod.versionsCheck().do();
    const isTestnet = result['genesis_id'].includes('testnet');
    const isBuyOrder = order.type === 'buy';

    let appId;
    if (isTestnet && isBuyOrder) {
      appId = constants.TEST_ALGO_ORDERBOOK_APPID;
    } else if (isTestnet) {
      appId = constants.TEST_ASA_ORDERBOOK_APPID;
    }

    if (!isTestnet && isBuyOrder) {
      appId = constants.ALGO_ORDERBOOK_APPID;
    } else if (!isTestnet) {
      appId = constants.ASA_ORDERBOOK_APPID;
    }
    return appId;
  },
  /**
   * ## [⚙ Set Config](#setConfig)
   *
   * Override the current configuration. This is a manditory operation for the
   * use of {@link AlgodexApi}. It is run when a {@link Config} is passed to the
   * constructor of {@link AlgodexApi} or when a consumer updates an instance of
   * the {@link AlgodexApi}
   *
   * @example
   * let algodex = new Algodex({wallet, asset, config})
   * algodex.setConfig(newConfig)
   *
   * @todo Add Application IDs
   * @method
   * @param {Config} config Configuration Object
   * @param {SetterOptions} [options] Options for setting
   * @throws ValidationError
   * @fires AlgodexApi#InitEvent
   */
  setConfig(config, options = {throws: true, validate: true}) {
    const err = _getValidationError(config, 'Config', options);
    if (err) throw err;
    // TODO: Get Params
    // this.params = await algosdk.getParams()
    if (!_.isEqual(config, this.config)) {
      this.isInitialized = false;

      // TODO: add params
      // Set instance
      /**
       * @type {Algodv2}
       */
      this.algod =
        config.algod instanceof algosdk.Algodv2 ?
          config.algod :
          config.algod.uri.endsWith('ps2') ?

            new algosdk.Algodv2(
                config.algod.token,
                config.algod.uri,
                config.algod.port || '',
                {
                  'x-api-key': config.algod.token, // For Purestake
                },
            ) :
            new algosdk.Algodv2(
                config.algod.token,
                config.algod.uri,
                config.algod.port || '',
            )
      ;

      this.indexer =
        config.indexer instanceof algosdk.Indexer ?
          config.indexer :

          config.indexer.uri.endsWith('idx2') ?

            new algosdk.Indexer(
                config.indexer.token,
                config.indexer.uri,
                config.indexer.port || '',
                {
                  'x-api-key': config.indexer.token, // For Purestake
                },
            ) :
            new algosdk.Indexer(
                config.indexer.token,
                config.indexer.uri,
                config.indexer.port || '',
            );
      // this.dexd = new AlgodexClient(config.dexd.uri);

      const apiVersion = config.dexd.apiVersion ? config.dexd.apiVersion : 1;
      this.http = {
        explorer: new ExplorerClient(config.explorer.uri),
        dexd: new AlgodexClient(config.dexd.uri, true, apiVersion, config.dexd.uriV1),
        indexer: new IndexerClient(
          config.indexer instanceof algosdk.Indexer ?
            this.indexer.c.bc.baseURL.origin :
            config.indexer.uri,
          false,
          config,
          this.indexer,
        ),
      };

      this.config = config;
      /**
       * ### ✔ isInitialized
       * Flag for having a valid configuration
       * @type {boolean}
       */
      this.isInitialized = true;

      this.emit('initialized', this.isInitialized);
    }
  },
  /**
   * ## [⚙ Set Asset](#setAsset)
   *
   * Changes the current asset. This method is also run when an {@link Asset} is
   * passed to the constructor of {@link AlgodexApi}.
   *
   * @example
   * // Assign during construction
   * const api = new AlgodexAPI({config, asset: {id: 123456}})
   *
   * @example
   * // Dynamically configure Asset
   * api.setAsset({
   *   id: 123456
   * })
   *
   * @param {Asset} asset Algorand Asset
   * @param {SetterOptions} [options] Options for setting
   * @throws ValidationError
   * @fires AlgodexApi#AssetEvent
   */
  setAsset(asset, options = {validate: true}) {
    const err = _getSetterError(
        asset,
        {
          key: 'Asset',
          initialized: this.isInitialized,
          options,
        },
    );
    if (err) throw err;

    // Set the asset

    Object.freeze(asset);
    /**
     * ### ⚙ asset
     *
     * Current asset. Use {@link AlgodexApi#setAsset} to update
     *
     * @type {Asset}
     */
    this.asset = asset;
    this.emit('asset-change', this.asset);
  },
  /**
   * ## [⚙ Set Wallet](#setWallet)
   *
   * Configure the current wallet.
   *
   * @param {Wallet} _wallet
   * @param {SetterOptions} [options] Options for setting
   * @throws ValidationError
   * @fires AlgodexApi#WalletEvent
   */
  setWallet(_wallet, options = {validate: true, merge: false}) {
    const wallet = options.merge ? {
      ...this.wallet,
      ..._wallet,
    }: _wallet;

    if (_.isUndefined(wallet)) {
      throw new TypeError('Must have valid wallet');
    }

    if (_hasValidateOption(options)) {
      const validate = ajv.getSchema('Wallet');
      // Validate basic type errors
      if (!validate(wallet)) {
        const err = new ValidationError(validate.errors);
        this.emit('error', err);
        throw err;
      }
    }
    if (wallet.type === 'sdk' &&
      typeof wallet.mnemonic !== 'undefined' &&
      typeof wallet.connector.sk === 'undefined'
    ) {
      wallet.connector.sk = algosdk.mnemonicToSecretKey(wallet.mnemonic).sk;
      wallet.connector.connected = true;
    }

    // Object.freeze(wallet);
    // TODO: Get Account Info
    // this.wallet do update = await getAccountInfo()
    Object.freeze(wallet);
    /**
     * ### 👛 wallet
     *
     * Current wallet. Use {@link AlgodexApi#setWallet} to update
     * @type {Wallet}
     */
    this.wallet = wallet;
    this.emit('wallet', {type: 'change', wallet});
  },
  /**
   *
   * @param {Order} order Order to check
   * @param {Array<Order>} [orderbook] The Orderbook
   * @return {Promise<boolean>}
   */
  async getIsExistingEscrow(order, orderbook) {
    // Fetch the orderbook when it's not passed in
    const res = typeof orderbook === 'undefined' ?
      await this.http.dexd.fetchOrders('wallet', order.address):
      orderbook;

    // Filter orders by current order
    return res.filter((o)=>{
      // Check for order types
      return o.type === order.type &&
        // If the creator is the orders address
        o.contract.creator === order.address &&
        // If the entries match
        (order.contract.entry.slice(59) === o.contract.entry || order.contract.entry === o.contract.entry);
    }).length > 0;
  },
  /**
   * ## [💱 Place Order](#placeOrder)
   *
   * Execute an Order in Algodex. See {@link Order} for details of what
   * order types are supported
   *
   * @todo Add Order Logic
   * @param {Order} _order
   * @param {Object} [options]
   * @param {Wallet} [options.wallet]
   * @param {Array} [options.orderbook]
   * @param {Function} callbackFn
   * @throws Errors.ValidationError
   * @fires AlgodexApi#OrderEvent
   */
  async placeOrder( _order, {wallet: _wallet, orderbook}={}, callbackFn) {
    // Massage Wallet
    let wallet = typeof _wallet !== 'undefined' ? _wallet : this.wallet;
    if (typeof wallet === 'undefined') {
      throw new Error('No wallet found!');
    }
    if (
      typeof wallet.connector === 'undefined' ||
      !wallet.connector.connected
    ) {
      throw new Error('Must connect wallet!');
    }

    if (typeof wallet?.assets === 'undefined') {
      wallet = {
        ...wallet,
        ...await this.http.indexer.fetchAccountInfo(wallet),
      };
    }

    // Massage Order
    const order = typeof _order !== 'undefined' ? _order : this.order;

    // TODO: move to introspection method
    if (
      typeof order?.asset === 'undefined' ||
      typeof order?.asset?.id === 'undefined' ||
      typeof order?.asset?.decimals === 'undefined'
    ) {
      throw new TypeError('Invalid Asset');
    }

    // Fetch orders
    if (typeof orderbook === 'undefined') {
      const res = await this.http.dexd.fetchAssetOrders(order.asset.id);
      // TODO add clean api endpoint
      orderbook = this.http.dexd.mapToAllEscrowOrders({
        buy: res.buyASAOrdersInEscrow,
        sell: res.sellASAOrdersInEscrow,
      });
    }
    let resOrders;

    if (order?.wallet?.type === 'my-algo-wallet' && typeof callbackFn === 'function') {
      callbackFn('Awaiting Signature - Sign the transaction with the MyAlgo pop-up');
    }
    if (order?.wallet?.type === 'wallet-connect' && typeof callbackFn === 'function') {
      callbackFn('Awaiting Signature - Check your wallet app to sign the transaction');
    }
    const execute = composePromise(
        ()=>resOrders,
        (txns)=>{
          if (typeof callbackFn === 'function') {
            callbackFn('Awaiting confirmation');
          }
          return _sendTransactions(this.algod, txns);
        },
        (orders)=>{
          resOrders = orders;
          return wallet.connector.sign(orders, wallet?.connector?.sk);
        },
        (o)=>structure(this, o),
    );

    return await execute({
      ...order,
      total: typeof order.total === 'undefined' ? order.amount * order.price : order.total,
      version: typeof order.version === 'undefined' ? constants.ESCROW_CONTRACT_VERSION : order.version,
      appId: typeof order.appId === 'undefined' ? await this.getAppId(order) : order.appId,
      client: this.algod,
      indexer: this.indexer,
      asset: {
        ...order.asset,
        orderbook,
      },
      wallet: {
        ...wallet,
        orderbook: orderbook.filter(
            ({orderCreatorAddr})=>orderCreatorAddr===wallet.address,
        ),
      },
    });
  },
  /**
   * Close An Existing Order
   * @param {Order} order
   * @param {Function} callbackFn
   * @return {Promise<function(*): *>}
   */
  async closeOrder(order, callbackFn) {
    let resOrders;

    if (order?.wallet?.type === 'my-algo-wallet' && typeof callbackFn === 'function') {
      callbackFn('Awaiting Signature - Sign the transaction with the MyAlgo pop-up');
    }

    if (order?.wallet?.type === 'wallet-connect' && typeof callbackFn === 'function') {
      callbackFn('Awaiting Signature - Check your wallet app to sign the transaction');
    }

    const execute = composePromise(
        () => resOrders,
        (txns) =>{
          if (typeof callbackFn === 'function') {
            callbackFn('Awaiting confirmation');
          }
          return _sendTransactions(this.algod, txns);
        },
        (orders) => {
          resOrders = orders;
          return order.wallet.connector.sign(orders, order.wallet?.connector?.sk);
        },
        (o) => structure(this, o),
    );
    let _order = {
      ...order,
      version: typeof order.version === 'undefined' ? constants.ESCROW_CONTRACT_VERSION : order.version,
      appId: typeof order.appId === 'undefined' ? await this.getAppId(order) : order.appId,
      client: typeof order.algod !== 'undefined' ? order.algod : this.algod,
      indexer: typeof order.indexer !== 'undefined' ? order.indexer : this.indexer,
      execution: 'close',
    };
    if (!(_order?.contract?.lsig instanceof algosdk.LogicSigAccount)) {
      console.log('doesnt have lsig');
      _order = await compile(_order);
    }
    return await execute(_order);
  },
};

module.exports = AlgodexApi;

if (process.env.NODE_ENV === 'test') {
  module.exports._hasValidateOption = _hasValidateOption;
  module.exports._getSetterError = _getSetterError;
  module.exports._getValidationError = _getValidationError;
  module.exports._filterExistingWallets = _filterExistingWallets;
}
