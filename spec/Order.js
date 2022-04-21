// eslint-disable-next-line no-unused-vars
const algosdk = require('algosdk');
/**
 * # Order
 *
 * @example
 * const validate = ajv.getSchema('Asset')
 *
 * @typedef {Object} Order
 * @property {string} address Order Address
 * @property {number} amount Amount in order
 * @property {number} total Total of order
 * @property {("maker"|"taker"|"market")} execution Execution of order
 * @property {Asset} asset Algorand Asset
 * @property {number} price Asset Price
 * @property {Object} [contract] Composed Contract State
 * @property {number} contract.price Asset BaseUnit Price
 * @property {number} contract.amount Asset BaseUnit Amount
 * @property {number} contract.total Asset BaseUnit Total
 * @property {number} contract.N Numerator
 * @property {number} contract.D Denominator
 * @property {algosdk.SuggestedParams} [contract.params] Suggested Params
 * @property {algosdk.Algodv2} [client] Algosdk Client
 * @namespace Order
 */

/**
 * JSON Schema Specification
 * @type {Schema}
 * @name Schema
 * @memberOf Order
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Order.json',
  'title': 'Order',
  'description': 'Algorand standard asset',
  'type': 'object',
  'properties': {
    'id': {
      'type': 'number',
      'minimum': 0,
    },
  },
  'required': ['id'],
};
