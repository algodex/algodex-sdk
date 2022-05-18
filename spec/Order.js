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
 * @property {("maker"|"taker"|"market"|"both"|"execute"|"close")} execution Execution of order
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
// "type": "sell",
//     "price":  235.000000,
//     "amount": 0.1,
//     "total": 23.50000,
//     "execution": "both",
//     "address": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
//     "appId": 22045503,
//     "version": 6
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
    'type': {
      'type': 'string',
      'enum': ['buy', 'sell'],
    },
    'price': {
      'type': 'number',
      'multipleOf': 1,
    },
    'amount': {
      'type': 'number',
      'multipleOf': 1,
    },
    'total': {
      'type': 'number',
      'multipleOf': 1,
    },
    'execution': {
      'type': 'string',
      'enum': ['taker', 'both', 'maker', 'market'],
    },
    'address': {
      'type': 'string',
      'pattern': '[A-Z0-9]{58}',
      'description': 'An account public key',
    },
    'appId': {
      'type': 'number',
      'multipleOf': 1,
    },
    'version': {
      'type': 'number',
      'multipleOf': 1,
    },
  },
};
