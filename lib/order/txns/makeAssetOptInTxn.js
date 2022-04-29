const makeAssetTransferTxn = require('./makeAssetTransferTxn');

/**
 * Opt In Transaction
 * @param {Order} order
 * @return {Promise<Transaction>}
 */
async function makeAssetOptInTxn(order) {
  return await makeAssetTransferTxn(
      {...order,
        client: order.client, // TODO: Talk to Michael about this shape
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
