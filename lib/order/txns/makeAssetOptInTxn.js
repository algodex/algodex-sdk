const makeAssetTransferTxn = require('./makeAssetTransferTxn');

/**
 * Opt In Transaction
 * @param {Order} order
 * @return {Promise<Transaction>}
 */
async function makeAssetOptInTxn(order) {
  return await makeAssetTransferTxn(
      {
        client: order.client,
        asset: order.asset,
        contract: {
          from: order.contract.from,
          to: order.contract.from,
          amount: 0,
        },
      },
  );
}

module.exports = makeAssetOptInTxn;
