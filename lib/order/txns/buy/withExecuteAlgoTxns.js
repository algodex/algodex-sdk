const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');

/**
 * # 🔗 withExecuteAlgoTxns
 *
 * > Composed Order with Execution Transactions
 *
 * @param {Order} order
 * @param {boolean} withCloseout
 * @return {Promise<Order>}
 * @memberOf module:txns/buy
 */
async function withExecuteAlgoTxns(order, withCloseout) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeExecuteAlgoTxns(order, withCloseout),
    },
  };
}

module.exports = withExecuteAlgoTxns;
