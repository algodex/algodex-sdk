// ///////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
// ///////////////////////////
const logger = require('./logger');
const ValidationError = require('./error/ValidationError');
const compile = require('./order/compile');
const ajv = require('./schema');
const algosdk = require('algosdk');
const _ = require('lodash');
const ee = require('./events');
const AlgodexClient = require('./order/http/AlgodexClient');
const ExplorerClient = require('./http/clients/ExplorerClient');
const IndexerClient = require('./http/clients/IndexerClient');
const {groupBy} = require('./functions/base');
const structure = require('./order/structure');
// const structure = require('./txns/structure');

/**
 * ## [⚡ Initialized Event](#event:InitEvent)
 * Fires after a configuration is successful
 *
 * @event AlgodexApi#InitEvent
 * @type {boolean}
 */

/**
 * ## [⚡ Error Event](#event:ErrorEvent)
 * @event AlgodexApi#ErrorEvent
 * @type {Object}
 * @property {string} type Type of Event
 * @property {Error} error Error instance
 * @see {Errors}
 */

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
 * ## [⚡ Asset Event](#event:AssetEvent)
 * Fires during asset operations
 *
 * @event AlgodexApi#AssetEvent
 * @type {Object}
 * @property {string} type Type of Event
 * @property {Asset} asset Asset Data
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
 */

/**
 *
 * @param functions
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

/**
 *
 * @param {Array<Wallet>} a
 * @param {Array<Wallet>} b
 * @return {Array<Wallet>}
 * @private
 */
function _mergeAddresses(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    throw new TypeError('Must be an array of addresses!');
  }
  const map = new Map();
  a.forEach((wallet) => map.set(wallet.address, wallet));
  b.forEach((wallet) => map.set(wallet.address, {...map.get(wallet.address), ...wallet}));
  return Array.from(map.values());
}

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

const sendTransactions = async (client, signedTxns) => {
  const signedGroups = groupBy(signedTxns, 'groupNum');
  // terrible practice but fine for the time being.
  for (const group in signedGroups) {
    if (group !== 'prototype') {
      const {txId} = await client.sendRawTransaction(signedGroups[group]).do();
      await algosdk.waitForConfirmation(client, txId, 10);
    }
  }
};
// Prototypes
AlgodexApi.prototype = {
  // Top level awaits vs lifecycle hooks
  // async init() {
  //   this.isInitialized = false;
  //
  //   this.emit('init', {...this});
  // },
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
      this.algod = new algosdk.Algodv2(
          config.algod.token,
          config.algod.uri,
          config.algod.port | '',
      );

      this.indexer = new algosdk.Indexer(
          config.indexer.token,
          config.indexer.uri,
          config.indexer.port | '',
      );

      // this.dexd = new AlgodexClient(config.dexd.uri);

      this.http = {
        explorer: new ExplorerClient(
            'https://testnet.algoexplorerapi.io',
        ),
        dexd: new AlgodexClient(config.dexd.uri),
        indexer: new IndexerClient(config.indexer.uri, false, config),
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
   * ## [⚙ Set Addresses](#setAddresses)
   *
   * Bulk update local address state, optionally merge instead of replace.
   * Accepts a {@link WalletList} and {@link SetterOptions}.
   *
   * @param {Array<Wallet>} _addresses
   * @param {SetterOptions} [options] Options for setting
   * @throws ValidationError
   */
  setAddresses(
      _addresses,
      options = {throws: true, merge: true, validate: true},
  ) {
    // logger.log('Setting Addresses', _addresses);
    const err = _getSetterError(
        _addresses,
        {
          key: 'Addresses',
          initialized: this.isInitialized,
          options,
        },
    );
    if (err && options.throws) throw err;

    if (options.merge) {
      const result = _mergeAddresses(_addresses, this.addresses || []);
      if (!_.isEqual(result, this.addresses)) {
        logger.info('Merging');
        this.addresses = result;
      }
    } else if (!_.isEqual(this.addresses, _addresses)) {
      this.addresses = _addresses;
    }

    if (typeof this.wallet === 'undefined') {
      this.setWallet(this.addresses[0]);
    }
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
   * ## [⚙ Set Order](#setOrder)
   *
   * Set an order. This is used to validate an order before placing it.
   *
   * @param {Order} order
   * @throws ValidationError
   * @fires AlgodexApi#OrderEvent
   */
  setOrder(order) {
    if (!_.isEqual(order, this.order)) {
      const _order = {
        ...this.order,
        ...order,
      };

      _order.total = _order.price * _order.amount;
      Object.freeze(_order);
      /**
       * ### order
       * @type {Order}
       */
      this.order = _order;
      this.emit('order', {type: 'update', _order});
    }
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
      const check = o.type === order.type &&
        // If the creator is the orders address
        o.contract.creator === order.address &&
        // If the entries match
        (order.contract.entry.slice(59) === o.contract.entry || order.contract.entry === o.contract.entry);
      // Check for order types
      return check;
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
   * @throws Errors.ValidationError
   * @fires AlgodexApi#OrderEvent
   */
  async placeOrder( _order, {wallet: _wallet, orderbook}={}) {
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
    let execute;
    if (order.execution === 'both') {
      execute = composePromise(
          (txns)=>sendTransactions(this.algod, txns),
          (o)=>wallet.connector.sign(o.contract.txns, wallet?.connector?.sk),
          structure,
          compile,
      );
    } else {
      execute = composePromise(
          (txns)=>sendTransactions(this.algod, txns),
          (o)=>wallet.connector.sign(o.contract.txns, wallet?.connector?.sk),
          structure,
          compile,
      );
    }

    return await execute({
      ...order,
      client: this.algod,
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
  // /**
  //  * ## [❌ Close Order](#closeOrder)
  //  *
  //  * @param {Order} order
  //  * @throws Errors.ValidationError
  //  * @fires AlgodexApi#OrderEvent
  //  */
  // async closeOrder(order) {
  //   const res = await closeOrderFromOrderBookEntry(
  //       this.algod,
  //       order.escrow,
  //       order.wallet.address,
  //       order.entry,
  //       order.version,
  //   );
  //   this.emit('order', {type: 'closed', order});
  //   return res;
  // },
};

module.exports = AlgodexApi;

if (process.env.NODE_ENV === 'test') {
  module.exports._hasValidateOption = _hasValidateOption;
  module.exports._getSetterError = _getSetterError;
  module.exports._getValidationError = _getValidationError;
  module.exports._filterExistingWallets = _filterExistingWallets;
}
