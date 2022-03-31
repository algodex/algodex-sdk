const {
  getQueuedTakerOrders, getAccountInfo, getMinWalletBalance, dumpVar,
} = require('../functions/base');

const getWalletAlgoBalance = require('./structures/withGetWalletAlgoBalance');
const getWalletAssetAmount = require('./structures/withGetWalletAssetAmount');
const determineFinalOrderAndWalletAmounts = require('./structures/withDetermineFinalOrderAndWalletAmounts');
const getStructuredTakerTxns = require('./structures/withGetStructuredTakerTxns');
const composeTakerTxnsWithMaker = require('./structures/withComposeTakerTxnsWithMaker');
const algosdk = require('algosdk');

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


