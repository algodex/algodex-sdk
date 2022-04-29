const logger = require('../logger');

/**
 *
 * @param {Order} order Order Object
 * @return {string}
 * @memberOf module:order/compile.withOrderbookEntry
 */
function getOrderbookEntry( order) {
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
  logger.debug('order.getOrderbookEntry final str is: ' + rtn);
  return rtn;
}

module.exports = getOrderbookEntry;
