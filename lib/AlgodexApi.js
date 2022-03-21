// ///////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
// ///////////////////////////

const fns = require('./functions');
const deprecate = require('./functions/deprecate.js');
const ValidationError = require('./errors/ValidationError');
const ajv = require('./schema');
const algosdk = require('algosdk');
const _ = require('lodash');

const DEPRECATED_STATICS = {
  ...fns,
};

/**
 * Setter Options
 * @typedef {Object} SetterOptions
 * @property {boolean} validate Enable validation
 */

/**
 * @typedef {Object.<number, spec.Wallet>} WalletList
 */
/**
 * Check for a validation flag in options
 *
 * @param {SetterOptions} options Setter Options
 * @return {boolean}
 * @private
 */
function hasValidateOption(options) {
  return (
    typeof options !== 'undefined' &&
    typeof options.validate !== 'undefined' &&
    options.validate
  );
}

/**
 * # 📦 AlgodexAPI
 * Construct an instance of the API
 *
 * The API requires several services to operate. These include but are not
 * limited to {@link AlgoExplorer}, {@link Algodv2}, {@link Indexer}, and
 * {@link Dexd}
 *
 * @example
 * // Constructing a valid instance
 * const api = new AlgodexAPI({
 *   config:{
 *     algod:{
 *       uri: "https://your-algod-url"
 *       token: "A-SECRET-TOKEN"
 *       port: 8080
 *     },
 *     indexer:{
 *       uri: "https://your-indexer-url"
 *       token: "A-SECRET-TOKEN"
 *       port: 8080
 *     },
 *     dexd:{
 *       uri: "https://testnet.algodex.com/algodex-backend"
 *       token: "A-SECRET-TOKEN"
 *     }
 *   }
 * })
 * @param {APIProperties} props API Constructor Properties
 * @constructor
 */
function AlgodexApi(props = {}) {
  const {config, asset, wallet} = props;
  this.type = 'API';
  const validate = ajv.getSchema('APIProperties');

  // Validate Parameters
  if (!validate({type: this.type, wallet, asset, config})) {
    // Failed to Construct Algodex()
    throw new ValidationError(validate.errors);
  }

  // Initialization Flag
  this.isInitalized = false;

  // Initialize the instance, skip validation
  const options = {validate: false};
  if (typeof config !== 'undefined') this.setConfig(config, options);
  if (typeof wallet !== 'undefined') this.setWallet(wallet, options);
  if (typeof asset !== 'undefined') this.setAsset(asset, options);
}

// Add deprecated functions as static
Object.keys(DEPRECATED_STATICS).forEach((key) => {
  AlgodexApi[key] = deprecate(DEPRECATED_STATICS[key]);
});

// Prototypes
AlgodexApi.prototype = {
  /**
   * ## ⚙ Set Config
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
   * @param {Config} config Configuration Object
   * @param {SetterOptions} [options] Options for setting
   */
  setConfig(config, options = {validate: true}) {
    // Optional validation
    if (hasValidateOption(options)) {
      const validate = ajv.getSchema('Config');
      // Validate Parameter
      if (!validate(config)) {
        // algodex.setConfig() ValidationError
        throw new ValidationError(validate.errors);
      }
    }

    if (!_.isEqual(config, this.config)) {
      this.isInitalized = false;

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
      this.isInitalized = true;
    }
  },
  /**
   * ## ⚙ Set Asset
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
   * @param {spec.Asset} asset Algorand Asset
   * @param {SetterOptions} [options] Options for setting
   */
  setAsset(asset, options = {validate: true}) {
    if (!this.isInitalized) {
      throw new Error('Algodex not initialized, run setConfig');
    }
    if (hasValidateOption(options)) {
      const validate = ajv.getSchema('Asset');
      // Validate basic type errors
      if (!validate(asset)) {
        // algodex.setAsset Validation Error
        throw new ValidationError(validate.errors);
      }

      // More advanced state checks
      // if(this.wallet[asset.id].balance === 0){
      //   throw new Error('Low Balance')
      // }
    }

    // Set the asset
    this.asset = asset;
  },
  /**
   * ## ⚙ Set Addresses
   *
   * Bulk update local address state, optionally merge instead of replace.
   * Accepts a {@link WalletList} and {@link SetterOptions}.
   *
   * @param {WalletList} addresses
   * @param {SetterOptions} [options] Options for setting
   */
  setAddresses(addresses, options = {merge: false, validate: true}) {
    if (!this.isInitalized) {
      throw new Error('Algodex not initialized, run setConfig');
    }
    if (hasValidateOption(options)) {
      const validate = ajv.getSchema('Wallet.AddressList');
      // Validate basic type errors
      if (!validate(addresses)) {
        throw new ValidationError(validate.errors);
      }
    }
    this.addresses = addresses;
    if (typeof this.wallet === 'undefined' && this.addresses.length > 0) {
      this.setWallet(this.addresses[0]);
    }
  },
  /**
   * ## ⚙ Set Wallet
   *
   * Configure the current wallet.
   *
   * @param {spec.Wallet} wallet
   * @param {SetterOptions} [options] Options for setting
   */
  setWallet(wallet, options = {validate: true}) {
    if (_.isUndefined(wallet)) {
      throw new TypeError('Must have valid wallet');
    }
    if (!this.isInitalized) {
      throw new Error('Algodex not initialized, run setConfig');
    }
    if (hasValidateOption(options)) {
      const validate = ajv.getSchema('Wallet');
      // Validate basic type errors
      if (!validate(wallet)) {
        throw new ValidationError(validate.errors);
      }
    }
    this.wallet = wallet;
  },

  /**
   * ## ⚙ Set order
   * @param {Order} order
   */
  setOrder(order) {

  },

  /**
   * ## ⚡ Place Order
   * @todo Add Order Logic
   * @param {Order} order
   */
  placeOrder(order) {

  },
};

module.exports = AlgodexApi;


