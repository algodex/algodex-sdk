const getOrderbookEntry = require('../utils/getOrderbookEntry');

/**
 * ## 🗃 [With Orderbook Entry](#withOrderbookEntry)
 *
 * Adds the orderbook entry to the order
 *
 * @param {Order} o Order
 * @return {Order} Order with Entry
 * @memberOf module:order/compile
 */
function withOrderbookEntry(o) {
  if (typeof o?.contract?.N === 'undefined') {
    throw new TypeError('Invalid Numerator!');
  }
  if (typeof o?.contract?.D === 'undefined') {
    throw new TypeError('Invalid Denominator!');
  }

  return {
    ...o,
    contract: {
      ...o.contract,
      entry: getOrderbookEntry(o),
    },
  };
}

module.exports = withOrderbookEntry;
