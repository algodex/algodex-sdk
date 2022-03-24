/**
 * Order
 *
 * @example
 * const validate = ajv.getSchema('Asset')
 *
 * @typedef {Object} Order
 * @property {number} id Asset Index
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
