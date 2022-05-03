const hasCorrectProperties = require('./hasCorrectProperties');

/**
 * ## ✉ getRunningBalance
 * Validates and returns algoWalletAmount associated
 * with an account
 *
 * @param {Account} queuedOrder order in current iteration of the structure loop

 * @return {Number} Asset or Algo balance of order
 * @memberOf module:order/structures
 */
function getRunningBalance(queuedOrder) {
  if (!hasCorrectProperties(queuedOrder, 'isASAEscrow', 'algoBalance' )) {
    throw new TypeError('Object is missing necessary properties');
  }
  return queuedOrder.isASAEscrow ?
          queuedOrder.asaBalance :
          queuedOrder.algoBalance;
}


module.exports = getRunningBalance;

