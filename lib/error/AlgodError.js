/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * # 🛑 AlgodError Error
 *
 * @memberOf Errors
 * @param {string} message Message
 */
function AlgodError(message) {
  this.message = message;
  this.name = 'AlgodError';
}

AlgodError.prototype = Object.create(TypeError.prototype);
module.exports = AlgodError;
