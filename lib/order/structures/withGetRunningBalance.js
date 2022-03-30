/* eslint-disable max-len */

/**
 * ## ✉ withGetRunningBalance
 * Validates and returns algoWalletAmount associated
 * with an account
 *
 * @param {Account} queuedOrder order in current iteration of the structure loop

 * @return {Number} Asset or Algo balance of order
 * @memberOf module:order/structures
 */
function withGetRunningBalance(queuedOrder) {
  return queuedOrder.isASAEscrow ?
    queuedOrder.asaBalance :
    queuedOrder.algoBalance;
}

module.exports = withGetRunningBalance;

