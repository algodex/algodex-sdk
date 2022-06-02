const compile = require('../../compile/compile');
const makePlaceAssetTxns = require('../../txns/sell/makePlaceAssetTxns');
const makePlaceAlgoTxns = require('../../txns/buy/makePlaceAlgoTxns');

/**
 * # 🏃 getMakerTxns
 * Determines which maker generator to use depending on the order type.
 * @param {Order} order The Maker Order
 * @return {Promise<Structure[]>}
 * @see [makePlaceAlgoTxns]{@link module:txns/buy.makePlaceAlgoTxns} || [makePlaceAssetTxns]{@link module:txns/sell.makePlaceAssetTxns}
 *
 */
async function getMakerTxns(order) {
  const GENERATORS = {
    // Buy Orderbook
    buy: makePlaceAlgoTxns,
    // Sell Orderbook
    sell: makePlaceAssetTxns,
  };

  return await GENERATORS[order.type](order);
}
module.exports = getMakerTxns;
