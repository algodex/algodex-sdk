
const {
  getQueuedTakerOrders, getAccountInfo, getMinWalletBalance, dumpVar,
  getNumeratorAndDenominatorFromPrice,
  getPlaceASAToSellASAOrderIntoOrderbook,
  getPlaceAlgosToBuyASAOrderIntoOrderbook,
} = require('../functions/base');

const getWalletAlgoBalance = require('./structures/withGetWalletAlgoBalance');
const getWalletAssetAmount = require('./structures/withGetWalletAssetAmount');
const determineFinalOrderAndWalletAmounts = require('./structures/withDetermineFinalOrderAndWalletAmounts');
const getStructuredTakerTxns = require('./structures/withGetStructuredTakerTxns');
const composeTakerTxnsWithMaker = require('./structures/withComposeTakerTxnsWithMaker');
const algosdk = require('algosdk');

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
  console.debug('in executeOrder');

  let queuedOrders = getQueuedTakerOrders(
      userWalletAddr,
      isSellingASA,
      allOrderBookOrders,
  );
  //   const allTransList = [];
  const transNeededUserSigList = [];

  // getMinWalletBalance calls getAccountInfo internally when flagged true,
  // why are we doing this twice? by flagging false we get the desired output
  // but and save on an async request
  const execAccountInfo = await getAccountInfo(userWalletAddr);
  // const alreadyOptedIn = false;
  console.debug('herezz56');
  console.debug({execAccountInfo});

  const takerMinBalance = await getMinWalletBalance(
      execAccountInfo,
      false, // cuts down on the async request
  );

  console.debug({min_bal: takerMinBalance});

  // let walletAssetAmount = 0;

  const walletAlgoAmount=getWalletAlgoBalance(execAccountInfo, takerMinBalance);

  if (!walletAlgoAmount) {
    console.debug('not enough to trade!! returning early');
    return;
  }

  const walletAssetAmount = getWalletAssetAmount(execAccountInfo, assetId);


  const getTakerOptedIn = (accountInfo, assetId) => {
    let takerAlreadyOptedIntoASA = false;
    if (accountInfo != null && accountInfo['assets'] != null &&
        accountInfo['assets'].length > 0) {
      for (let i = 0; i < accountInfo['assets'].length; i++) {
        if (accountInfo['assets'][i]['asset-id'] === assetId) {
          takerAlreadyOptedIntoASA = true;
          break;
        }
      }
    }
    return takerAlreadyOptedIntoASA;
  };
    // Can we safely assume that if the walletAssetAmount is greater than 0 that the account is opted in
  const takerIsOptedIn = getTakerOptedIn(execAccountInfo, assetId);

  const finalAmountsObj = {
    orderAssetAmount: orderAssetAmount,
    orderAlgoAmount: orderAlgoAmount,
    walletAlgoAmount: walletAlgoAmount,
    walletAssetAmount: walletAssetAmount,
  };


  const {
    orderAlgoBalance,
    orderAssetBalance,
  } = determineFinalOrderAndWalletAmounts(finalAmountsObj);


  const takerOrderBalance = {
    'asaBalance': orderAssetBalance,
    'algoBalance': orderAlgoBalance,
    'walletAlgoBalance': walletAlgoAmount,
    'walletASABalance': walletAssetAmount,
    'limitPrice': limitPrice,
    'takerAddr': userWalletAddr,
    'walletMinBalance': takerMinBalance,
    'takerIsOptedIn': takerIsOptedIn,
  };

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


