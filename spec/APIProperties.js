/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * API Properties Specification
 *
 * @typedef {Object} APIProperties
 * @property {Config} config Configuration
 * @property {Asset} asset Asset
 * @property {Wallet} wallet Wallet
 * @namespace APIProperties
 */

/**
 * JSON Schema Specification
 * @type {Schema}
 * @name APIPropertiesSchema
 * @memberOf Schema
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Algodex.json',
  'title': 'API',
  'type': 'object',
  'examples': [
    {
      'type': 'API',
      'config': {
        'algod': {
          'uri': 'https://testnet.algoexplorerapi.io',
          'token': '',
        },
        'indexer': {
          'uri': 'https://algoindexer.testnet.algoexplorerapi.io',
          'token': '',
        },
        'dexd': {
          'uri': 'https://testnet.algodex.com/algodex-backend',
          'token': '',
        },
      },
      'asset': {
        'id': 224234,
      },
      'wallet': {
        'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
        'type': 'my-algo-wallet',
        'assets': {224234: {'balance': 9, 'name': 'Amazing'}},
      },
    },
  ],
  'properties': {
    'type': {
      'const': 'API',
    },
    'config': {
      '$ref': 'https://schemas.algodex.com/v1/Config.json',
    },
    'asset': {
      '$ref': 'https://schemas.algodex.com/v1/Asset.json',
    },
    'wallet': {
      '$ref': 'https://schemas.algodex.com/v1/Wallet.json',
    },
  },
  'required': ['config'],
};
