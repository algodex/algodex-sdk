const makeCloseAssetTxns = require('./makeCloseAssetTxns');

/**
 * ## withCloseAlgoTxns
 *
 * Composed Close Asset Transactions
 * @param {Order} order
 * @return {Promise<Order>}
 * @memberOf module:txns/sell
 * @private
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
