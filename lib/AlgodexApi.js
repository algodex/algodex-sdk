// ///////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
// ///////////////////////////

const ValidationError = require('./Errors/ValidationError');
// const {
//   // structureOrder,
//   closeOrderFromOrderBookEntry,
//   // getAccountInfo,
//   // getPlaceAlgosToBuyASAOrderIntoOrderbook,
//   // getPlaceASAToSellASAOrderIntoOrderbook,
// } = require('./functions/base');
const compile = require('./order/compile');
const ajv = require('./schema');
const algosdk = require('algosdk');
const _ = require('lodash');
const ee = require('./events');
const AlgodexClient = require('./HTTP/clients/AlgodexClient');
const ExplorerClient = require('./HTTP/clients/ExplorerClient');
const IndexerClient = require('./HTTP/clients/IndexerClient');
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
   * @param {WalletList} addresses
   * @param {SetterOptions} [options] Options for setting
   * @throws ValidationError
   */
  setAddresses(
      addresses,
      options = {throws: true, merge: true, validate: true},
  ) {
    const err = _getSetterError(
        addresses,
        {
          key: 'Addresses',
          initialized: this.isInitialized,
          options,
        },
    );
    if (err && options.throws) throw err;

    this.addresses = options.merge ?
      _.unionBy(addresses, this.addresses || [], 'address') :
      addresses;
  },
  /**
   * ## [⚙ Set Wallet](#setWallet)
   *
   * Configure the current wallet.
   *
   * @param {Wallet} wallet
   * @param {SetterOptions} [options] Options for setting
   * @throws ValidationError
   * @fires AlgodexApi#WalletEvent
   */
  setWallet(wallet, options = {validate: true}) {
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

      // TODO: Get Account Info
      // if(wallet.info && new Date(wallet.info.timestamp){
      //  setWallet({
      //    ...this.wallet,
      //    info: await getAccountInfo()
      //  })
      // }
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

    return await compile({
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
      // TODO: create compatibility matrix of AppIDs
      appId: order.type === 'buy' ? 22045503 : 22045522,
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
