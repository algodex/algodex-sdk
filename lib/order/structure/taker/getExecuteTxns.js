const {makeExecuteAlgoTxns, makeExecuteAssetTxns} = require('../../txns');
const compile = require('../../compile');

/**
 * Get Executable Transactions
 *
 * Only supports execution of existing orders!
 *
 * @param {Order} order The Executable Order from the Orderbook
 * @param {boolean} withCloseout Should partially execute the order
 * @return {Promise<Structure[]>}
 * @ignore
 */
async function getExecuteTxns(order, withCloseout) {
  if (order.execution !== 'execute') {
    throw new Error(`Unsupported execution mode of ${order.execution}`);
  }
  const GENERATORS = {
    // Buy Orderbook
    buy: makeExecuteAlgoTxns,
    // Sell Orderbook
    sell: makeExecuteAssetTxns,
  };
  return await GENERATORS[order.type](await compile(order), withCloseout);
}

module.exports = getExecuteTxns;
