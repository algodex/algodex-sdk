/**
 * @typedef {Object} DaemonConfig
 * @property {URI} uri URI for resource
 * @property {string} token API Access Token
 * @property {number} port Service Port
 */

/**
 *
 * @typedef {Object} Config
 * @property {DaemonConfig} algod Algorand daemon configuration
 * @property {DaemonConfig} indexer Algorand indexer configuration
 * @property {DaemonConfig} dexd Algodex API configuration
 */

/**
 * ## 🔧 Config Schema
 *
 * JSON Schema of the HTTP configuration
 *
 * ```json
 * {
 *   '$schema': 'http://json-schema.org/draft-07/schema',
 *   '$id': 'https://schemas.algodex.com/v1/Config.json',
 *   'type': 'object',
 *   'properties': {
 *     'algod': {
 *       'type': 'object',
 *       'properties': {
 *         'uri': {
 *           '$ref': 'https://schemas.algodex.com/v1/URI.json',
 *         },
 *         'token': {
 *           'type': 'string',
 *         },
 *         'port': {
 *           'type': 'number',
 *           'minimum': 1,
 *         },
 *       },
 *       'required': [
 *         'uri',
 *         'token',
 *       ],
 *     },
 *     'indexer': {
 *       'type': 'object',
 *       'properties': {
 *         'uri': {
 *           '$ref': 'https://schemas.algodex.com/v1/URI.json',
 *         },
 *         'token': {
 *           'type': 'string',
 *         },
 *       },
 *       'required': [
 *         'uri',
 *         'token',
 *       ],
 *     },
 *     'dexd': {
 *       'type': 'object',
 *       'properties': {
 *         'uri': {
 *           '$ref': 'https://schemas.algodex.com/v1/URI.json',
 *         },
 *         'token': {
 *           'type': 'string',
 *         },
 *       },
 *       'required': [
 *         'uri',
 *         'token',
 *       ],
 *     },
 *   },
 *   'required': ['algod', 'indexer', 'dexd'],
 * }
 * ```
 *
 * @type {Schema}
 * @name ConfigSchema
 * @memberOf Schema
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Config.json',
  'type': 'object',
  'properties': {
    'algod': {
      'type': 'object',
      'properties': {
        'uri': {
          '$ref': 'https://schemas.algodex.com/v1/URI.json',
        },
        'token': {
          'type': 'string',
        },
        'port': {
          'type': 'number',
          'minimum': 1,
        },
      },
      'required': [
        'uri',
        'token',
      ],
    },
    'indexer': {
      'type': 'object',
      'properties': {
        'uri': {
          '$ref': 'https://schemas.algodex.com/v1/URI.json',
        },
        'token': {
          'type': 'string',
        },
      },
      'required': [
        'uri',
        'token',
      ],
    },
    'dexd': {
      'type': 'object',
      'properties': {
        'uri': {
          '$ref': 'https://schemas.algodex.com/v1/URI.json',
        },
        'token': {
          'type': 'string',
        },
      },
      'required': [
        'uri',
        'token',
      ],
    },
  },
  'required': ['algod', 'indexer', 'dexd'],
};