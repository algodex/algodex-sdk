/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * ## 💰 Addresses Schema
 *
 * JSON Schema of the Wallet. Used for validation in
 * {@link AlgodexApi#setAddresses}
 * ```json
 * {
 * '$schema': 'http://json-schema.org/draft-07/schema',
 *   '$id': 'https://schemas.algodex.com/v1/Addresses.json',
 *   'type': 'array',
 *   'items': {
 *     '$ref': 'https://schemas.algodex.com/v1/Wallet.json',
 *   },
 * }
 * ```
 * @name Wallet
 * @type {Schema}
 * @memberOf Schema
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Addresses.json',
  'type': 'array',
  'items': {
    '$ref': 'https://schemas.algodex.com/v1/Wallet.json',
  },
};
