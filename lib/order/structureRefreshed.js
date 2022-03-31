
const {
  dumpVar,
} = require('../functions/base');


const getStructuredTakerTxns = require('./structures/withGetStructuredTakerTxns');
const composeTakerTxnsWithMaker = require('./structures/withComposeTakerTxnsWithMaker');
const getTakerOrderInformation = require('./structures/withGetTakerOrderInformation');

/**
   *
   * @param {*} algodClient
   * @param {*} isSellingASA
   * @param {*} assetId
   * @param {*} userWalletAddr
   * @param {*} limitPrice
   * @param {*} orderAssetAmount
   * @param {*} orderAlgoAmount
   * @param {*} allOrderBookOrders
   * @param {*} includeMaker
   * @param {*} walletConnector
   */
async function structure(
    algodClient,
    isSellingASA,
    assetId,
    userWalletAddr,
    limitPrice,
    orderAssetAmount,
    orderAlgoAmount,
    allOrderBookOrders,
    includeMaker,
    walletConnector,
) {
  const orderObj = {
    isSellingASA: isSellingASA,
    assetId: assetId,
    userWalletAddr: userWalletAddr,
    limitPrice: limitPrice,
    orderAssetAmount: orderAssetAmount,
    orderAlgoAmount: orderAlgoAmount,
    allOrderBookOrders: allOrderBookOrders,
  };

  let {queuedOrders, takerOrderBalance} = getTakerOrderInformation(orderObj);

  console.debug('initial taker orderbalance: ', dumpVar(takerOrderBalance));

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

module.exports = structure;


