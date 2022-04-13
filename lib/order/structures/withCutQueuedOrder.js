/* eslint-disable max-len */

/**
 * ## ✉ withDetermineFinaleOrderAndWalletAmounts
 * takes a queued order object and returns a new object that has cutOrdertTimes
 * logic if needed
 *
 * @param {Object} cutQueuedOrderObject Object Of Order And Wallet amounts
 * @return {Object} Object containing queued order after being cut
 * @memberOf module:order/structures
 */
function withCutQueuedOrder(cutQueuedOrderObject) {
  const {queuedOrder, cutOrder, splitTimes, loopIndex, runningBalance} = cutQueuedOrderObject;
  const cutQueuedOrder = Object.assign({}, queuedOrder);

  if (cutOrder != null) {
    const shouldClose = (loopIndex < cutOrder.splitTimes - 1) ? false : null;
    const useForceShouldCloseOrNot = (loopIndex < cutOrder.splitTimes - 1);
    cutQueuedOrder.forceShouldClose = shouldClose;
    cutQueuedOrder.useForceShouldCloseOrNot = useForceShouldCloseOrNot;
    cutQueuedOrder.txnNum = loopIndex;

    if (loopIndex >= splitTimes - 1) {
      // This is the last iteration, so simply use the running balance
      if (cutQueuedOrder.isASAEscrow) {
        cutQueuedOrder.asaBalance = runningBalance;
      } else {
        cutQueuedOrder.algoBalance = runningBalance;
      }
    } else {
      if (cutQueuedOrder.isASAEscrow) {
        cutQueuedOrder.asaBalance = Math.min(
            cutOrder.cutOrderAmount,
            runningBalance,
        );
      } else {
        cutQueuedOrder.algoBalance = Math.min(
            cutOrder.cutOrderAmount,
            runningBalance,
        );
      }
    }
  }

  return cutQueuedOrder;
}


module.exports = withCutQueuedOrder;


