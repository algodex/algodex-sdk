// ///////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
// ///////////////////////////

const ValidationError = require('./Errors/ValidationError');
const {
  // structureOrder,
  closeOrderFromOrderBookEntry,
  // getPlaceAlgosToBuyASAOrderIntoOrderbook,
  // getPlaceASAToSellASAOrderIntoOrderbook,
} = require('./functions/base');
// const signingApi = require('./functions/signing_api');

const ajv = require('./schema');
const algosdk = require('algosdk');
const _ = require('lodash');
const ee = require('./events');


// async function executeOrderAsMakerAndTaker(
//     algodClient,
//     isSellingASA,
//     assetId,
//     userWalletAddr,
//     limitPrice,
//     orderAssetAmount,
//     orderAlgoAmount,
//     allOrderBookOrders,
//     walletConnector,
// ) {
//   const {params, allTransList} = await structureOrder(
//       algodClient,
//       isSellingASA,
//       assetId,
//       userWalletAddr,
//       limitPrice,
//       orderAssetAmount,
//       orderAlgoAmount,
//       allOrderBookOrders,
//       true,
//       walletConnector,
//   );
//
//   if (!!walletConnector && walletConnector.connector.connected) {
//     const signedGroupTransactions = await signingApi.signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
//     const confirmedWalletConnectArr = await signingApi.propogateTransactions(algodClient, signedGroupTransactions);
//     return confirmedWalletConnectArr;
//   } else {
//     const singedGroupedTransactions = await signingApi.signMyAlgo(algodClient, allTransList);
//     const confirmedMyAlgoWalletArr = await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
//     return confirmedMyAlgoWalletArr;
//   }
//
//   // return algodex.executeOrder(algodClient, isSellingASA, assetId,
//   //     userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, true, walletConnector);
// }
// function getAllEscrowOrders(orderBook) {
//   const mapOrders = (orders, type) => {
//     return orders.map((order) => ({
//       orderEntry: `${order.assetLimitPriceN}-${order.assetLimitPriceD}-${order.minimumExecutionSizeInAlgo}-${order.assetId}`,
//       price: order.assetLimitPriceInAlgos,
//       n: order.assetLimitPriceN,
//       d: order.assetLimitPriceD,
//       min: order.minimumExecutionSizeInAlgo,
//       version: order.version,
//       escrowAddr: order.escrowAddress,
//       algoBalance: order.algoAmount,
//       asaBalance: order.asaAmount,
//       escrowOrderType: type,
//       isASAEscrow: type === 'sell',
//       orderCreatorAddr: order.ownerAddress,
//       assetId: order.assetId,
//     }));
//   };
//   return mapOrders(orderBook.buyOrders, 'buy').concat(mapOrders(orderBook.sellOrders, 'sell'));
// }
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
 * @param data
 * @param key
 * @param options
 * @return {Errors.ValidationError}
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
 * @param key
 * @param initialized
 * @param options
 * @return {Errors.ValidationError|Error}
 * @private
 */
function _getSetterError(data, {key, initialized, options}) {
  if (!initialized) {
    return new Error('Algodex not initialized, run setConfig');
  }
  return _getValidationError(data, key, options);
}
/**
 * # 📦 AlgodexAPI
 *
 * The API requires several services to operate. These include but are not
 * limited to {@link AlgoExplorer}, {@link Algodv2}, {@link Indexer}, and
 * {@link Dexd}. This constructor allows for easy use of the underlying
 * smart contract {@link Transactions}.
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

  // Initialize the instance, skip validation
  const options = {validate: false};
  if (typeof config !== 'undefined') this.setConfig(config, options);
  if (typeof wallet !== 'undefined') this.setWallet(wallet, options);
  if (typeof asset !== 'undefined') this.setAsset(asset, options);
}

// Prototypes
AlgodexApi.prototype = {

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

    if (!_.isEqual(config, this.config)) {
      this.isInitialized = false;

      // Set instance
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
  setAddresses(addresses, options = {throws: false, merge: false, validate: true}) {
    const err = _getSetterError(
        addresses,
        {
          key: 'Wallet.AddressList',
          initialized: this.isInitialized,
          options,
        },
    );
    if (err && options.throws) throw err;

    this.addresses = addresses;
    if (typeof this.wallet === 'undefined' && this.addresses.length > 0) {
      this.setWallet(this.addresses[0]);
    }
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
    if (!this.isInitialized) {
      throw new Error('Algodex not initialized, run setConfig');
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
   * @param {Order} order
   * @throws Errors.ValidationError
   * @fires AlgodexApi#OrderEvent
   */
  placeOrder(order) {
    // console.log('OrderService.placeOrder', {order});
    // const assetId = order.asset.id || this.asset.id;
    // if (typeof assetId === 'undefined') throw new Error('Invalid Asset.id');
    //
    // const address = order.address;
    // const minimumAmount = 0;
    //
    // const asaAmount = convertToBaseUnits(order.amount, order.asset.decimals);
    // const algoAmount = convertToBaseUnits(order.total);
    //
    // const price = convertToAsaUnits(order.price, order.asset.decimals);
    // const {n: numerator, d: denominator} = algodex.getNumeratorAndDenominatorFromPrice(price);
    //
    // if (order.execution === 'maker') {
    //   if (order.type === 'buy') {
    //     console.log('Maker buy order', {
    //       address,
    //       price,
    //       assetId,
    //       algoAmount,
    //     });
    //     return getPlaceAlgosToBuyASAOrderIntoOrderbook(
    //         this.algod,
    //         address,
    //         numerator,
    //         denominator,
    //         minimumAmount,
    //         assetId,
    //         algoAmount,
    //     );
    //   } else if (order.type === 'sell') {
    //     console.log('Maker sell order', {
    //       address,
    //       price,
    //       assetId,
    //       asaAmount,
    //     });
    //     return getPlaceASAToSellASAOrderIntoOrderbook(
    //         this.algod,
    //         address,
    //         numerator,
    //         denominator,
    //         minimumAmount,
    //         assetId,
    //         asaAmount,
    //     );
    //   }
    // }
    //
    // const isSellOrder = order.type === 'sell';
    // const limitPrice = convertToAsaUnits(order.price, order.asset.decimals);
    //
    // const allOrderBookOrders = getAllEscrowOrders(orderBook);
    //
    // if (order.execution === 'taker') {
    //   console.log(`Taker ${order.type} order`, {
    //     isSellOrder,
    //     assetId,
    //     address,
    //     limitPrice,
    //     asaAmount,
    //     algoAmount,
    //   });
    //   return executeOrderAsTaker(
    //       AlgodClient,
    //       isSellOrder,
    //       assetId,
    //       address,
    //       limitPrice,
    //       asaAmount,
    //       algoAmount,
    //       allOrderBookOrders,
    //   );
    // }
    //
    // // const marketPrice = order.price
    //
    // if (order.execution === 'market') {
    //   console.log(`Market ${order.type} order`, {
    //     isSellOrder,
    //     assetId,
    //     address,
    //     limitPrice,
    //     asaAmount,
    //     algoAmount,
    //   });
    //   return algodex.executeMarketOrderAsTaker(
    //       AlgodClient,
    //       isSellOrder,
    //       assetId,
    //       address,
    //       limitPrice,
    //       asaAmount,
    //       algoAmount,
    //       allOrderBookOrders,
    //   );
    // }
    //
    // // order.execution === 'both' (default)
    //
    // console.log(`Maker/Taker ${order.type} order`, {
    //   isSellOrder,
    //   assetId,
    //   address,
    //   limitPrice,
    //   asaAmount,
    //   algoAmount,
    // });
    //
    // return executeOrderAsMakerAndTaker(
    //     AlgodClient,
    //     isSellOrder,
    //     assetId,
    //     address,
    //     limitPrice,
    //     asaAmount,
    //     algoAmount,
    //     allOrderBookOrders,
    // );
  },
  /**
   * ## [❌ Close Order](#closeOrder)
   *
   * @param {Order} order
   * @throws Errors.ValidationError
   * @fires AlgodexApi#OrderEvent
   */
  async closeOrder(order) {
    const res = await closeOrderFromOrderBookEntry(
        this.algod,
        order.escrow,
        order.wallet.address,
        order.entry,
        order.version,
    );
    this.emit('order', {type: 'closed', order});
    return res;
  },
  // /**
  //  * ## [💱 Execute Order](#executeOrder)
  //  * @param {Order} order
  //  */
  // executeOrder(order) {
  //
  // },
};

module.exports = AlgodexApi;

