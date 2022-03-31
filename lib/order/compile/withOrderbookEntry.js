
/**
 *
 * @param {*} makerWalletAddr
 * @param {*} N
 * @param {*} D
 * @param {*} min
 * @param {*} assetId
 * @param {*} includeMakerAddr
 * @return {string}
 * @memberOf module:order
 */
function generateEntry(
    makerWalletAddr,
    N,
    D,
    min,
    assetId,
    includeMakerAddr = true,
) {
  let rtn = N + '-' + D + '-' + min + '-' + assetId;
  if (includeMakerAddr) {
    rtn = makerWalletAddr + '-' + rtn;
  }
  return rtn;
}

/**
 * With Orderbook Entry
 *
 * Adds the orderbook entry to the order
 *
 * @param {Order} o Order
 * @return {Order} Order with Entry
 */
function withOrderbookEntry(o) {
  const minimumAmount = o.min || 0;

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
      entry: generateEntry(
          o.address,
          o.contract.N,
          o.contract.D,
          // TODO: Check min in generate order, follow up with Alex
          minimumAmount,
          o.asset.id,
          o.execution === 'maker',
      ),
    },
  };
}

module.exports = withOrderbookEntry;
