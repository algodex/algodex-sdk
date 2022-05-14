const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');

/**
 * # 🔗 withExecuteAlgoTxns
 *
 * > Composed Order with Execution Transactions
 *
 * @param {Order} order
 * @return {Promise<Structure[]>}
 * @memberOf module:txns/buy
 */
async function withExecuteAlgoOrderTxns(order) {
  return await makeExecuteAlgoTxns(order, order?.shouldClose);
}

module.exports = withExecuteAlgoOrderTxns;
