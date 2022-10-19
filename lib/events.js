/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const EventEmitter = require('eventemitter3');

let EE;

/**
 * Construct an Event Emitter
 *
 * Follows a singleton pattern
 *
 * @return {EventEmitter}
 */
function makeEventEmiiter() {
  if (typeof EE === 'undefined') {
    const _ee = new EventEmitter();
    EE = {
      on: (event, fn) => _ee.on(event, fn),
      once: (event, fn) => _ee.once(event, fn),
      off: (event, fn) => _ee.off(event, fn),
      emit: (event, payload) => _ee.emit(event, payload),
    };
    Object.freeze(EE);
  }
  return EE;
}

module.exports = makeEventEmiiter();
