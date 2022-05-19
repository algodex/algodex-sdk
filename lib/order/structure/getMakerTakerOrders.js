const getTakerOrders = require('./getTakerOrders');
const withMakerTxns = require('./maker/withMakerTxns');
const compile = require('../compile');

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

  /**
   * Remainder of the current order
   * @type {Number}
   */
  const remainder = orders.reduce((result, o) => result -= o.amount, order.amount);

  // Add Maker Order to response if overflow
  if (remainder > 0) {
    orders.push(
        await withMakerTxns(api, await compile({
          ...order,
          execution: 'maker',
          amount: remainder,
          total: remainder * order.price,
          appId: api.getAppId(order),
        })),
    );
  }

  return orders;
}


module.exports = getMakerTakerOrders;
