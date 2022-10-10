/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const makePlaceAssetTxns = require('../../txns/sell/makePlaceAssetTxns');
const makePlaceAlgoTxns = require('../../txns/buy/makePlaceAlgoTxns');

/**
 * # 🏃 getMakerTxns
 * Determines which maker generator to use depending on the order type.
 * @param {Order} order The Maker Order
 * @param {boolean} [optIn]
 * @return {Promise<Structure[]>}
 * @see [makePlaceAlgoTxns]{@link module:txns/buy.makePlaceAlgoTxns} || [makePlaceAssetTxns]{@link module:txns/sell.makePlaceAssetTxns}
 * @memberOf module:order/structure
 */
async function getMakerTxns(order, optIn = false) {
  const GENERATORS = {
    // Buy Orderbook
    buy: makePlaceAlgoTxns,
    // Sell Orderbook
    sell: makePlaceAssetTxns,
  };

  return await GENERATORS[order.type](order, optIn);
}
module.exports = getMakerTxns;
