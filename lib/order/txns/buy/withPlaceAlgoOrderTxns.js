const makePlaceAlgoTxns = require('./makePlaceAlgoTxns');
/**
 * # 🔗 withPlaceAlgoOrderTxns
 *
 * > Order Composed with Place Transaction
 *
 * Add the outer transactions for an Algo order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @example
 * const order = withPlaceAlgoOrderTxns(await compile({
 *     'asset': {
 *         'id': 15322902,
 *         'decimals': 6,
 *       },
 *       'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
 *       'price': 2,
 *       'amount': 1,
 *       'total': 2,
 *       'execution': 'maker',
 *       'type': 'buy',
 *       'appId': 22045503,
 *       'version': 6,
 * }))
 * // View the transactions
 * console.log(order.contract.txns)
 *
 * @see module:txns/buy.makePlaceAlgoTxns
 * @param {Order} order Algodex Order
 * @param {boolean} [optIn] Flag to enable opting into the asset
 * @return {Order} The Order with Transaction
 * @memberOf module:txns/buy
 */
async function withPlaceAlgoOrderTxns(order, optIn =false) {
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns: await makePlaceAlgoTxns(order, optIn),
    },
  };
}

module.exports = withPlaceAlgoOrderTxns;
