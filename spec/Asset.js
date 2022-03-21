/**
 * Algorand standard asset
 *
 * @example
 * const validate = ajv.getSchema('Asset')
 *
 * @typedef {Object} Asset
 * @property {number} id Asset Index
 */

/**
 * JSON Schema Specification
 * @type {import('ajv').Schema}
 * @name AssetSchema
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Asset.json',
  'title': 'Asset',
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
