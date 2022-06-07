const makeCloseAlgoTxns = require('./makeCloseAlgoTxns');

/**
 * Composed With Algo Order Txns
 * @param {Order} order
 * @return {Promise<Order>}
 * @memberOf module:txns/buy
 */
async function withCloseAlgoTxns(order) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeCloseAlgoTxns(order),
    },
  };
}

module.exports = withCloseAlgoTxns;
