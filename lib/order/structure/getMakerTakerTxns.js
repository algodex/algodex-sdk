const getTakerOrders = require('./getTakerOrders');
const withMakerTxns = require('./maker/withMakerTxns');
const fromBaseUnits = require('../../utils/units/fromBaseUnits');
const compile = require('../compile');
const logger = require('../../logger');
/**
 * # getMakerTakerTxns
 * **Description:**  Returns an array.
 *
 *
 * It first fetches TakerTxns using [getTakerOrders]{@link module:order/structure.getTakerOrders} . If there is a remainder, it concats the return of getTakerOrders
 * and the return of [withMakerTxns]{@link module:order/structure.withMakerTxns}.
 *
 * @example
 * const api = require(@AlgodexApi)
 * //order.execution === 'both'
 * let res = await getTakerOrders(api, order)
 * console.log(res.contract.txns)
 * //Outputs an array with items being some combination of the below :
 * [withExecuteAssetOrderTxns]{@link module:txns/sell.withExecuteAssetOrderTxns} || [withExecuteAlgoOrderTxns]{@link module:txns/buy.withExecuteAlgoOrderTxns} || [withPlaceAssetOrderTxns]{@link module:txns/sell.withPlaceAssetOrderTxns}  || [withPlaceAlgoOrderTxns]{@link module:txns/buy.withPlaceAlgoOrderTxns}
 * @param {AlgodexApi} api The Algodex API
 * @param {Order} order The Order from the User
 * @return {Promise<Array<Order>>} A promise of all compiled and structured Orders
 * @memberOf module:order/structure
 * @see [withExecuteAssetOrderTxns]{@link module:txns/sell.withExecuteAssetOrderTxns} || [withExecuteAlgoOrderTxns]{@link module:txns/buy.withExecuteAlgoOrderTxns} || [withPlaceAssetOrderTxns]{@link module:txns/sell.withPlaceAssetOrderTxns}  || [withPlaceAlgoOrderTxns]{@link module:txns/buy.withPlaceAlgoOrderTxns}
 *
 */
async function getMakerTakerOrders(api, order) {
  if (order.execution !== 'both') {
    throw new TypeError(`Unsupported execution of ${order.execution}, use both for automated orderbook matching`);
  }
  /**
   * All Orders
   *
   * Starts with available Taker Transactions
   * @type {Array<Order>}
   */
  const orders = [...await getTakerOrders(api, {...order, execution: 'taker'})];

  logger.debug( `getMakerTakerOrders: Created ${orders.length} Taker Order(s)`);

  /**
   * Remainder of the current order
   * @type {Number}
   */
  const remainder = orders.reduce((result, o) => result -= fromBaseUnits(o.contract.amount), order.amount);

  // Add Maker Order to response if overflow
  if (remainder > 0) {
    orders.push(
        await withMakerTxns(api, await compile({
          ...order,
          execution: 'maker',
          amount: remainder,
          total: remainder * order.price,
          appId: api.getAppId(order),
          indexer: api.indexer,
        })),
    );
    logger.debug(`getMakerTakerOrders: Created 1 Maker Order`);
  }

  logger.debug(`getMakerTakerOrders: Created ${orders.length} Order(s)`);
  return orders;
}


module.exports = getMakerTakerOrders;
