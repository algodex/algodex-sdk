/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * @param {*} message
 * @memberOf Errors
 */
function OrderTypeError(message) {
  this.message = message;
  this.name = 'OrderTypeError';
}

OrderTypeError.prototype = TypeError.prototype;

module.exports = OrderTypeError;
