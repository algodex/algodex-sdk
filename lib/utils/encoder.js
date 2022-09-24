/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

let encoder;

/**
 * Create a TextEncoder
 * @return {TextEncoder}
 */
function makeEncoder() {
  if (typeof encoder === 'undefined') {
    encoder = new TextEncoder();
  }
  return encoder;
}

module.exports = makeEncoder();
