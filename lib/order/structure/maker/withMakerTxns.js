const getMakerTxns = require('./getMakerTxns');

/**
 * Composed Get Maker Txns
 *
 * @param {Order} order The User's Order
 * @return {Promise<Order>}
 */
async function withMakerTxns(api, order) {
  const isExistingEscrow = await api.getIsExistingEscrow(order);
  if (isExistingEscrow) {
    console.log(
        'hmmppf',
    );
    order.contract = {
      ...order.contract,
      creator: order.address,
    };
  }

  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await getMakerTxns(order),
    },
  };
}
module.exports = withMakerTxns;
