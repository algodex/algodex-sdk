/**
 * Order
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
 * @property {number} N Numerator
 * @property {number} D Denominator
 * @property {string} to To Algorand Address
 * @property {string} [from] From Algorand Address
 */

/**
 * JSON Schema Specification
 * @type {Schema}
 * @name OrderSchema
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
