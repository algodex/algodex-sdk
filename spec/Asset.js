/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
