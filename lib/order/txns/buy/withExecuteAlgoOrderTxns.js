const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');

/**
 *
 * @param {Order} order
 * @return {Promise<Structure[]>}
 */
async function withExecuteAlgoOrderTxns(order) {

  return await makeExecuteAlgoTxns(order)
}

module.exports = withExecuteAlgoOrderTxns;
