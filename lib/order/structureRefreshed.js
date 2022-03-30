
const {
  getQueuedTakerOrders, getAccountInfo, getMinWalletBalance, dumpVar,
  getCutOrderTimes, getExecuteOrderTransactionsAsTakerFromOrderEntry,
  getAlgoandAsaAmounts, finalPriceCheck, getNumeratorAndDenominatorFromPrice,
  getPlaceASAToSellASAOrderIntoOrderbook,
  getPlaceAlgosToBuyASAOrderIntoOrderbook, signAndSendWalletConnectTransactions,
  printTransactionDebug, waitForConfirmation, allSettled,
} = require('../functions/base');

const getWalletAlgoBalance = require('./structures/withGetWalletAlgoBalance');
const getWalletAssetAmount = require('./structures/withGetWalletAssetAmount');
const determineFinalOrderAndWalletAmounts = require('./structures/withDetermineFinalOrderAndWalletAmounts');
const continueStructureLoopCheck = require('./structures/withToContinueStructureLoop');
const getRunningBalance = require('./structures/withGetRunningBalance');
const cutQueuedOrder = require('./structures/withCutQueuedOrder');
const structureSingleTransListWithAllTransList = require('./structures/withStructureSingleTransListWithGroupOrder');
const getSplitTimesByIter = require('./structures/withGetSplitTimesByIter');
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
  const allTransList = [];
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
  let txOrderNum = 0;
  let groupNum = 0;
  const txnFee = 0.004 * 1000000; // FIXME minimum fee;

  const params = await algodClient.getTransactionParams().do();
  let lastExecutedPrice = -1;

  for (let i = 0; i < queuedOrders.length; i++) {
    if (takerOrderBalance['orderAlgoAmount'] <= txnFee) {
      // Overspending issues
      continue;
    }

    continueStructureLoopCheck(
        takerOrderBalance,
        isSellingASA,
        queuedOrders[i]['price']);


    const {cutOrder, splitTimes} = getSplitTimesByIter(queuedOrders[i], i);

    let runningBalance = getRunningBalance(queuedOrders[i]);

    let outerBreak = false;
    for (let jj = 0; jj < splitTimes; jj++) {
      if (runningBalance <= 0) {
        throw new Error('Unexpected 0 or below balance');
      }
      console.debug(
          'running balance: ' +
          runningBalance +
          ' isASAEscrow: ' +
          queuedOrders[i].isASAEscrow,
      );


      const cutQueuedOrderObject = {
        queuedOrder: queuedOrders[i],
        cutOrder: cutOrder,
        splitTimes: splitTimes,
        loopIndex: jj,
        runningBalance: runningBalance,
      };


      const queuedOrder = cutQueuedOrder(cutQueuedOrderObject);

      const singleOrderTransList =
          await getExecuteOrderTransactionsAsTakerFromOrderEntry(
              algodClient,
              queuedOrder,
              takerOrderBalance,
              params,
              walletConnector,
          );


      if (singleOrderTransList == null) {
        // Overspending issue
        outerBreak = true;
        break;
      }
      const [algo, asa] = getAlgoandAsaAmounts(singleOrderTransList);


      finalPriceCheck(algo, asa, limitPrice, isSellingASA);

      lastExecutedPrice = queuedOrder['price'];
      // Be Warned: allTransList is persisted via a side effect
      const newTxnOrderNum = structureSingleTransListWithAllTransList(
          singleOrderTransList, allTransList, txOrderNum, groupNum,
      );
      txOrderNum= newTxnOrderNum; // so next loop remembers total
      groupNum++;
      runningBalance -= cutOrder != null ? cutOrder.cutOrderAmount : 0;
    }
    if (outerBreak) {
      break;
    }
  }


  let makerTxns = null;
  console.debug('here55999a ', {lastExecutedPrice, limitPrice});
  if (includeMaker) {
    const numAndDenom = lastExecutedPrice !== -1 ?
        getNumeratorAndDenominatorFromPrice(lastExecutedPrice) :
        getNumeratorAndDenominatorFromPrice(limitPrice);
    const leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
    const leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
    console.debug('includeMaker is true');
    if (isSellingASA && leftoverASABalance > 0) {
      console.debug('leftover ASA balance is: ' + leftoverASABalance);

      makerTxns = await getPlaceASAToSellASAOrderIntoOrderbook(
          algodClient,
          userWalletAddr,
          numAndDenom.n,
          numAndDenom.d,
          0,
          assetId,
          leftoverASABalance,
          false,
          walletConnector,
      );
    } else if (!isSellingASA && leftoverAlgoBalance > 0) {
      console.debug('leftover Algo balance is: ' + leftoverASABalance);

      makerTxns = await getPlaceAlgosToBuyASAOrderIntoOrderbook(
          algodClient,
          userWalletAddr,
          numAndDenom.n,
          numAndDenom.d,
          0,
          assetId,
          leftoverAlgoBalance,
          false,
          walletConnector,
      );
    }
  }

  if (makerTxns != null) {
    for (let k = 0; k < makerTxns.length; k++) {
      const trans = makerTxns[k];
      trans['txOrderNum'] = txOrderNum;
      trans['groupNum'] = groupNum;
      txOrderNum++;
      allTransList.push(trans);
      if (trans['needsUserSig'] === true) {
        transNeededUserSigList.push(trans);
      }

      if (typeof (trans.lsig) !== 'undefined') {
        if (!walletConnector || !walletConnector.connector.connected) {
          const signedTxn = algosdk.signLogicSigTransactionObject(
              trans.unsignedTxn,
              trans.lsig,
          );
          trans.signedTxn = signedTxn.blob;
        }
      }
    }
    groupNum++;
  }
  if (allTransList == null || allTransList.length == 0) {
    console.debug('no transactions, returning early');
  }

  const txnsForSigning = [];
  for (let i = 0; i < transNeededUserSigList.length; i++) {
    txnsForSigning.push(transNeededUserSigList[i]['unsignedTxn']);
  }

  console.debug('here 8899b signing!!');
  if (txnsForSigning == null || txnsForSigning.length == 0) {
    return;
  }

  return allTransList;
}

module.exports = structure;


