const getTakerOrders = require('./getTakerOrders');
const withMakerTxns = require('./maker/withMakerTxns');
const fromBaseUnits = require('../../utils/units/fromBaseUnits');
const compile = require('../compile');
const logger = require('../../logger');
/**
 * # 🏃 getMakerTakerTxns
 * This method represents the synthesis of two execution types: [Maker]{@tutorial Maker} and [Taker]{@tutorial Taker}  and is represented as "Both".
 *
 * It first fetches TakerTxns using [getTakerOrders]{@link module:order/structure.getTakerOrders} . If there is a remainder, it concats the return of getTakerOrders
 * and the return of [withMakerTxns]{@link module:order/structure.withMakerTxns}.
 *
 * ### Scenarios:
 * 1. There are no Taker orders that meet the criteria.
 * * The return of [getTakerOrders]{@link module:order/structure.getTakerOrders} is empty. The entire order is [compiled]{@link module:order/compile} as a maker using [withMakerTxns]{@link module:order/structure.withMakerTxns}.
 * 2. There are taker orders and no remainder.
 * * The return of [getTakerOrders]{@link module:order/structure.getTakerOrders} is not empty, maker leg is skipped.
 * 3. There are taker orders with a remainder
 * * The return of [getTakerOrders]{@link module:order/structure.getTakerOrders} is not empty, the remainder is [compiled]{@link module:order/compile} as a maker using [withMakerTxns]{@link module:order/structure.withMakerTxns}.
 *
 * ### When is it used?
 * This execution type is mainly used with our frontend. Since getMakerTakerTxns is robust enough to
 * handle both order types, it acts as a catch all method for placing orders with a UI.
 *
 * If you are planning on integrating Algodex's service into your own UI this is a good method to facillate placing of orders.
 * The more granular methods are beneficial for algorithmic trading strategies.
 *
 *
 *
 *
 * @example
 * const [AlgodexAPI]{@link AlgodexApi} = require(@algodex/algodex-sdk)
 * const api = new [AlgodexAPI]{@link AlgodexApi}(require('../config.json'))
 * const order = {
 *   "client": api.algod,
 *   "indexer": api.indexer,
 *   "asset": {
 *     "id": 15322902,
 *     "decimals": 6,
 *   },
 *   "address": "TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I",
 *   "price": 2.22,
 *   "amount": 1,
 *   "total": 2,
 *   "execution": "both",
 *   "type": "buy",
 *   "appId": 22045503,
 *   "version": 6
 * }
 *
 * let res = await getTakerOrders(api, order)
 * console.log(res.contract.txns)
 * //Outputs an array with items being some combination of the below :
 * [withExecuteAssetTxns]{@link module:txns/sell.withExecuteAssetTxns} || [withExecuteAlgoTxns]{@link module:txns/buy.withExecuteAlgoTxns} || [withPlaceAssetTxns]{@link module:txns/sell.withPlaceAssetTxns}  || [withPlaceAlgoTxns]{@link module:txns/buy.withPlaceAlgoTxns}
 * @param {AlgodexApi} api The Algodex API
 * @param {Order} order The Order from the User
 * @return {Promise<Array<Order>>} A promise of all compiled and structured Orders
 * @memberOf module:order/structure
 * @throws ValidationError
 * @see [withExecuteAssetTxns]{@link module:txns/sell.withExecuteAssetTxns} || [withExecuteAlgoTxns]{@link module:txns/buy.withExecuteAlgoTxns} || [withPlaceAssetTxns]{@link module:txns/sell.withPlaceAssetTxns}  || [withPlaceAlgoTxns]{@link module:txns/buy.withPlaceAlgoTxns}
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
  const remainder = orders.reduce((result, o) => result -= fromBaseUnits(o.contract.amount, order.asset.decimals), order.amount);

  const assetPrecision = 1/(10 ** order.asset.decimals);

  if (orders.length > 0 && orders[0].type === 'sell') {
    if (remainder * order.price < 0.500001) {
      return orders; // This is to prevent placing a maker buy order with a total amount less than 0.5 algo
    }
  }
  // Add Maker Order to response if overflow
  if (remainder >= assetPrecision) {
    orders.push(
        await withMakerTxns(api, await compile({
          ...order,
          execution: 'maker',
          amount: remainder,
          total: remainder * order.price,
          appId: await api.getAppId(order),
          indexer: api.indexer,
        })),
    );
    logger.debug(`getMakerTakerOrders: Created 1 Maker Order`);
  }

  logger.debug(`getMakerTakerOrders: Created ${orders.length} Order(s)`);
  return orders;
}


module.exports = getMakerTakerOrders;
