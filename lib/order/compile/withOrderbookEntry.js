
/**
 *
 * @param {Order} order Order Object
 * @return {string}
 * @memberOf module:order/compile
 */
function generateEntry( order) {
  const {
    address,
    contract: {N, D},
    min = 0,
    asset: {id: assetId},
    execution,
  } = order;

  let rtn = N + '-' + D + '-' + min + '-' + assetId;
  if (execution === 'maker') {
    rtn = address + '-' + rtn;
  }
  console.debug('generateEntry final str is: ' + rtn);
  return rtn;
}

/**
 * With Orderbook Entry
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
      entry: generateEntry(o),
    },
  };
}

module.exports = withOrderbookEntry;
