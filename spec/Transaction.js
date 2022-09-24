/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/Transaction.json',
  'description': 'A bas transaction',
  'type': 'object',
  'properties': {
    'account': {
      'type': 'string',
    },
    'size': {
      'type': 'integer',
      'minimum': 0.28,
    },
    'price': {
      'type': 'integer',
      'minimum': 0,
    },
    'asset': {
      'type': 'object',
      'properties': {
        'id': {
          'type': 'integer',
        },
      },
      'required': [
        'id',
      ],
    },
    'appId': {
      'type': 'integer',
    },
    'optIn': {
      'type': 'boolean',
    },
  },
  'required': [
    'account', 'asset', 'appId',
  ],
}
;
