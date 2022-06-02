const makeCloseAssetTxns = require('./makeCloseAssetOrderTxns');

/**
 * Composed Close Asset Transactions
 * @param {Order} order
 * @return {Promise<*>}
 * @memberOf module:txns/close
 *
 */
async function withCloseAssetOrderTxns(order) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeCloseAssetTxns(order),
    },
  };
}

module.exports = withCloseAssetOrderTxns;
