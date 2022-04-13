/**
 * # 📝 Asset Specification
 *
 * @example
 * const validate = ajv.getSchema('Asset')
 *
 * @typedef {Object} Asset
 * @property {number} id Asset Index
 * @property {number} decimals Asset Decimals
 * @namespace Asset
 */

/**
 * ## 📝 Asset Specification
 * @type {Schema}
 * @name AssetSchema
 * @see {AlgodexApi#setAsset}
 * @memberOf Schema
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
    'balance': {
      'type': 'number',
      'minimum': 0,
    },
  },
  'required': ['id'],
};
