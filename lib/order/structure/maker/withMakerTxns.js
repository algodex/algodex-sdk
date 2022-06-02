const getMakerTxns = require('./getMakerTxns');

/**
 * # 🔗 withMakerTxns
 * Add the outer transactions for maker order. This method attatches generated transactions to the order contract property.
 * 
 * @example 
 * const compile = require(@order/compile)
 * const api = require(@AlgodexApi)
 * 
 * //order.execution === 'maker'
 * let res = await withMakerTxns(api, await compile(order))
 * console.log(res.contract.txns)
 * //Outputs Structures[] 
 *
 * @param {Order} order The User's Order
 * @return {Promise<Order>}
 * @memberOf module:order/structure
 * @see [getMakerTxns]{@link getMakerTxns}
 */
async function withMakerTxns(api, order) {
  const isExistingEscrow = await api.getIsExistingEscrow(order);
  if (isExistingEscrow) {
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
