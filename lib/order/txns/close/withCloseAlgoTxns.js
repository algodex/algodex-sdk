const makeCloseAlgoTxns = require('./makeCloseAlgoTxns');

/**
 * ## ✉ withCloseAlgoTxns
 *
 * @param {Order} order
 * @return {Promise<Order>}
 * @memberOf module:txns/buy
 * @private
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
