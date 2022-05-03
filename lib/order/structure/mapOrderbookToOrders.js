/**
 *
 * @param {object} ob Orderbook Object
 * @return {Order} A Order Object
 **/
function mapOrderbookToOrders(ob) {
  return {
    type: ob.escrowOrderType,
    price: parseFloat(ob.price),
    asset: {
      id: ob.assetId,
    },
    contract: {
      amount: ob.escrowOrderType === 'sell' ? ob.asaBalance : ob.algoBalance,
      N: ob.n,
      D: ob.d,
      min: ob.min,
      entry: ob.orderEntry,
      escrow: ob.escrowAddr,
      creator: ob.orderCreatorAddr,
    },
    version: ob.version,
  };
}
module.exports = mapOrderbookToOrders;
