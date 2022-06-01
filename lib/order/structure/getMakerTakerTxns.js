const getTakerOrders = require('./getTakerOrders');
const withMakerTxns = require('./maker/withMakerTxns');
const fromBaseUnits = require('../../utils/units/fromBaseUnits');
const compile = require('../compile');
const logger = require('../../logger');
/**
 * getMakerTakerTxns
 *
 * It first fetches TakerTxns with {@link getTakerOrders}. Then, if there is a remainder or no executable orders
 * available, it creates new MakerTxns with {@link withMakerTxns}. No MakerTxns are returned when the order is
 * fulfilled by the existing orders
 *
 *
 *
 * @param {AlgodexApi} api The Algodex API
 * @param {Order} order The Order from the User
 * @return {Promise<Array<Order>>} A promise of all compiled and structured Orders
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
