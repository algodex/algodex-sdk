/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * ## 📝 Wallet List
 * @typedef {Object.<number, Wallet>} List
 * @memberOf Wallet
 */

/**
 * ## 💰 Assets
 *
 * A List of type {@link Asset} keyed by {@link Asset#id}. Used as a lookup
 * for the current asset order.
 *
 * @example
 * const assets = {
 *   123456: {
 *     decimals: 5
 *     balance: 100
 *   }
 * }
 *
 * @typedef {Object.<string, Asset>} assets
 * @memberOf Wallet
 */

/**
 * # 📝 Wallet Specification
 *
 * See the {@link Schema.Wallet} for property validations
 *
 * @typedef {Object} Wallet
 * @property {string} type Type of Wallet
 * @property {string} address Wallet Address
 * @property {Asset} algo Balance in ALGOs
 * @property {string} [name] Optionally name the wallet
 * @property {Wallet.assets} [assets] Assets owned by the Wallet
 * @namespace Wallet
 *
 * @see {AlgodexApi#setWallet}
 */

/**
 * ## 💰 Wallet Schema
 *
 * JSON Schema of the Wallet. Used for validation in
 * {@link AlgodexApi#setWallet}
 * ```json
 * {
 *   '$schema': 'http://json-schema.org/draft-07/schema',
 *   '$id': 'https://schemas.algodex.com/v1/Wallet.json',
 *   'type': 'object',
 *   'properties': {
 *     'type': {
 *       'type': 'string',
 *       'enum': ['my-algo-wallet', 'wallet-connect', 'sdk'],
 *     },
 *     'address': {
 *       'type': 'string',
 *       'pattern': '[A-Z0-9]{58}',
 *       'description': 'An account public key',
 *     },
 *     'name': {
 *       'type': 'string',
 *     },
 *     'algo': {
 *       '$ref': 'https://schemas.algodex.com/v1/Asset.json',
 *     },
 *     'assets': {
 *       'type': 'object',
 *       'additionalProperties': {
 *         '$ref': 'https://schemas.algodex.com/v1/Asset.json',
 *       },
 *     },
 *   },
 * }
 * ```
 * @name Wallet
 * @type {Schema}
 * @memberOf Schema
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Wallet.json',
  'type': 'object',
  'properties': {
    'type': {
      'type': 'string',
      'enum': ['my-algo-wallet', 'wallet-connect', 'sdk'],
    },
    'address': {
      'type': 'string',
      'pattern': '[A-Z0-9]{58}',
      'description': 'An account public key',
    },
    'name': {
      'type': 'string',
    },
    'algo': {
      '$ref': 'https://schemas.algodex.com/v1/Asset.json',
    },
    'assets': {
      'type': 'array',
    },
  },
  'required': ['address', 'type'],
};
