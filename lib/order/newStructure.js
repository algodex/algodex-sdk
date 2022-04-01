const getStructuredTakerTxns = require('./structures/withGetStructuredTakerTxns');
const composeTakerTxnsWithMaker = require('./structures/withComposeTakerTxnsWithMaker');


/**
   *
   * @param {*} isSellingASA
   * @param {*} takerOrderBalance
   * @param {*} queuedOrders
   * @param {*} limitPrice
   * @param {*} includeMaker

   */
async function newStructure(
    isSellingASA,
    takerOrderBalance,
    queuedOrders,
    limitPrice,
    includeMaker,
) {
  if (queuedOrders == null && !includeMaker) {
    console.debug('null queued orders, returning early');
    return;
  }
  if (queuedOrders == null) {
    queuedOrders = [];
  }

  const takerTransObject = await getStructuredTakerTxns(takerOrderBalance, queuedOrders, isSellingASA);

  if (!includeMaker) {
    return takerTransObject.allTransList;
  } else {
    return await composeTakerTxnsWithMaker(takerOrderBalance, takerTransObject, limitPrice, isSellingASA);
  }
}

module.exports = newStructure;


