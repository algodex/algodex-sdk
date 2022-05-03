const logger = require('../../logger');
const {getCutOrderTimes} = require('../../functions/base');
/**
 * ## ✉ withGetSplitTimesByIter
 * calculates cutOrder and splitTimes
 *
 * @param {Object} walletAndOrderAmountObj Object Of Order And Wallet amounts
 * @param {Number} loopIndex index of structure loop
 * @return {Object} Object containing splitTimes and cutOrder properties
 * @memberOf module:order/structures
 */
function withGetSplitTimesByIter(queueOrder, loopIndex) {
  let cutOrder = null;
  let splitTimes = 1;
  if (loopIndex === 0) {
    cutOrder = getCutOrderTimes(queueOrder);
    splitTimes = cutOrder.splitTimes;
  } else {
    cutOrder = null;
  }
  logger.debug('cutOrder, splitTimes: ', {cutOrder, splitTimes});
  return {cutOrder, splitTimes};
}


module.exports = withGetSplitTimesByIter;


