const mapOrderbookToOrders = require('./mapOrderbookToOrders');
/**
 *
 * @param {Order} entry An Orderbook Entry
 * @param {Order} order A Order to Filter by
 * @return {boolean}
 */
function _filterQueuedOrders(
    entry,
    order,
) {
  // TODO set bounds for price matching
  return entry.type === order.type &&
    entry.price === order.price &&
    entry.contract.creator !== order.address;
}

/**
 *
 * @param {Order} order The Order
 * @return {Array} Queued Orders
 **/
function getQueuedOrders(order) {
  const orders = order.asset.orderbook
      .map(mapOrderbookToOrders)
      .filter(
          (entry)=>_filterQueuedOrders(entry, order),
      );

  if (order.type === 'buy') {
    // sort highest first (index 0) to lowest (last index)
    // these are buy orders, so we want to sell to the highest first
    orders.sort((a, b) => (a.price < b.price) ? 1 : (a.price === b.price) ? ((a.price < b.price) ? 1 : -1) : -1);
  } else {
    // sort lowest first (index 0) to highest (last index)
    // these are sell orders, so we want to buy the lowest first
    orders.sort((a, b) => (a.price > b.price) ? 1 : (a.price === b.price) ? ((a.price > b.price) ? 1 : -1) : -1);
  }
  return orders;
}
module.exports = getQueuedOrders;
