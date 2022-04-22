/** @module order/txns */
const teal = require('../../teal');

/**
 * order.makeAssetTransferTxn
 * @param {Order} order
 * @param {boolean} shouldClose
 * @return {Promise<Transaction>}
 */
async function makeAssetTransferTxn(order, shouldClose) {
  return await teal.txns.makeAssetTransferTxn(
      order.client,
      order.contract.from,
      order.contract.to,
      order.contract.amount,
      order.asset.id,
      order.contract.params,
      shouldClose,
  );
}

module.exports = makeAssetTransferTxn;
