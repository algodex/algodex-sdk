const makeCloseAssetTxns = require('./makeCloseAssetOrderTxns');

/**
 * Composed Close Asset Transactions
 * @param order
 * @return {Promise<*&{contract: (*&{txns: Structure[]})}>}
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
