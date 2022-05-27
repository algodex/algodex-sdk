const compile = require('../../compile/compile');
const makePlaceAssetTxns = require('../../txns/sell/makePlaceAssetTxns');
const makePlaceAlgoTxns = require('../../txns/buy/makePlaceAlgoTxns');

/**
 * getMakerTxns
 *
 * Map Order to MakerTxns. Only accepts Maker Orders
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
