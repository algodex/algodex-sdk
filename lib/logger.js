/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const pino = require('pino');

let logger;

/**
 * Create the Logger
 * @return {*|pino.BaseLogger}
 */
function makeLogger() {
  if (typeof logger === 'undefined') {
    logger = pino({
      level: process.env.LOG_LEVEL || 'debug',
    });
  }
  return logger;
}

module.exports = makeLogger();
