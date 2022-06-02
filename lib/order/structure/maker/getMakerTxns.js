const compile = require('../../compile/compile');
const makePlaceAssetTxns = require('../../txns/sell/makePlaceAssetTxns');
const makePlaceAlgoTxns = require('../../txns/buy/makePlaceAlgoTxns');

/**
 * # getMakerTxns
 * Determines which maker generator to use depending on the order type.
 *
 * @see [For Buy Orders]{@link module:txns/buy.makePlaceAlgoTxns}
 *
 *
 * @see [For Sell Orders]{@link module:txns/sell.makePlaceAssetTxns}
 *
 *
 *
 *
 * @param {Order} order The Maker Order
 * @return {Promise<Structure[]>}
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
