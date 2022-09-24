/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const logger = require('../../logger');

/**
 *
 * @param {Order} order Order Object
 * @return {string}
 * @memberOf module:order/compile.withOrderbookEntry
 */
function getOrderbookEntry(order) {
  const {
    address,
    contract: {N, D},
    min = 0,
    asset: {id: assetId},
    execution,
  } = order;

  let rtn = N + '-' + D + '-' + min + '-' + assetId;
  if (execution === 'maker') {
    rtn = address + '-' + rtn;
  }
  logger.debug('getOrderbookEntry final str is: ' + rtn);
  return rtn;
}

module.exports = getOrderbookEntry;
