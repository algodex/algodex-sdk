const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');

/**
 * # 🔗 withExecuteAlgoTxns
 *
 * > Composed Order with Execution Transactions
 *
 * @param {Order} order
 * @return {Promise<Order>}
 * @memberOf module:txns/buy
 */
async function withExecuteAlgoTxns(order, closeTo) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeExecuteAlgoTxns(order, closeTo),
    },
  };
}

module.exports = withExecuteAlgoTxns;
