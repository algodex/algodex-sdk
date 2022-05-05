const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');

/**
 *
 * @param {Order} order
 * @return {Promise<Structure[]>}
 */
async function withExecuteAlgoOrderTxns(order, closeRemainderTo) {
  return await makeExecuteAlgoTxns(order, closeRemainderTo);
}

module.exports = withExecuteAlgoOrderTxns;
