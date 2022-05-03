const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');

/**
 *
 * @param {Order} order
 * @return {Promise<Structure[]>}
 */
async function withExecuteAlgoOrderTxns(order) {
  const {
    cutTakerOrder: {
      escrowCreator,
      asaAmountSending,
      algoAmountReceiving,
      lsig},
  } = order;

  return await makeExecuteAlgoTxns({
    ...order,
    contract: {
      ...order.contract,
      amountSending: asaAmountSending,
      amountReceiving: algoAmountReceiving,
      lsig: lsig,
      creator: escrowCreator,
    },

  });
}

module.exports = withExecuteAlgoOrderTxns;
