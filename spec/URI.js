/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * URI for a resource
 * @typedef {string} URI
 * @memberOf URI
 */


/**
 * ## 🕸 URI Schema
 *
 * JSON Schema of a URI
 *
 * ```json
 * {
 *   '$schema': 'http://json-schema.org/draft-07/schema',
 *   '$id': 'https://schemas.algodex.com/v1/URI.json',
 *   'type': 'string',
 *   'format': 'uri',
 * }
 * ```
 * @type {Schema}
 * @name URI
 * @memberOf Schema
 */
module.exports = {
  '$schema': 'http://json-schema.org/draft-07/schema',
  '$id': 'https://schemas.algodex.com/v1/URI.json',
  'type': 'string',
  'format': 'uri',
};
