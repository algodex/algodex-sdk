const makeCloseAlgoTxns = require('./makeCloseAlgoOrderTxns');

/**
 * Composed With Algo Order Txns
 * @param {Order} order
 * @return {Promise<Order>}
 * @memberOf module:txns/close
 */
async function withCloseAlgoOrderTxns(order) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeCloseAlgoTxns(order),
    },
  };
}

module.exports = withCloseAlgoOrderTxns;
