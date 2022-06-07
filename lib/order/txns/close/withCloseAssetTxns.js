const makeCloseAssetTxns = require('./makeCloseAssetTxns');

/**
 * Composed Close Asset Transactions
 * @param {Order} order
 * @return {Promise<*>}
 * @memberOf module:txns/sell
 *
 */
async function withCloseAssetTxns(order) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await makeCloseAssetTxns(order),
    },
  };
}

module.exports = withCloseAssetTxns;
