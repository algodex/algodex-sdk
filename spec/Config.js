/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * @typedef {Object} DaemonConfig
 * @property {URI} uri URI for resource
 * @property {string} token API Access Token
 * @property {number} port Service Port
 * @ignore
 */

/**
 *
 * @typedef {Object} Config
 * @property {DaemonConfig} algod Algorand daemon configuration
 * @property {DaemonConfig} indexer Algorand indexer configuration
 * @property {DaemonConfig} dexd Algodex API configuration
 * @memberOf APIProperties
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
      oneOf: [
        {
          'type': 'object',
          'properties': {
            'uri': {
              '$ref': 'https://schemas.algodex.com/v1/URI.json',
            },
            'token': {
              oneOf: [
                {'type': 'string'},
                {'type': 'object'},
              ],
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
        {instanceof: 'Algodv2'},
      ],

    },
    'indexer': {
      oneOf: [
        {
          'type': 'object',
          'properties': {
            'uri': {
              '$ref': 'https://schemas.algodex.com/v1/URI.json',
            },
            'token': {
              oneOf: [
                {'type': 'string'},
                {'type': 'object'},
              ],
            },
          },
          'required': [
            'uri',
            'token',
          ],
        },
        {instanceof: 'Indexer'},
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
