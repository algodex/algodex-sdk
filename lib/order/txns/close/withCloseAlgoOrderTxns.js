const makeCloseAlgoTxns = require('./makeCloseAlgoOrderTxns');

/**
 * Composed With Algo Order Txns
 * @param order
 * @return {Promise<*&{contract: (*&{txns: Promise<Structures>})}>}
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
