const makeCloseAssetTxns = require('./makeCloseAssetOrderTxns');

/**
 * Composed Close Asset Transactions
 * @param {Order} order
 * @return {Promise<*>}
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
