/**
 * Specifications for the AlgodexAPI. Used to validate types of objects in
 * the ecosystem
 *
 * @example
 * const ajv = require('@algodex/algodex-sdk/lib/schema')
 *
 * const validate = ajv.getSchema('Config')
 *
 * if(!validate({some: 'thing'})){
 *   console.error('validate.errors[0].message')
 * }
 *
 *
 * @namespace spec
 */

module.exports = {
  API: require('./API'),
  Asset: require('./Asset'),
  Config: require('./Config'),
  URI: require('./URI'),
  Wallet: require('./Wallet'),
};
