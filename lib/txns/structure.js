const {
  getQueuedTakerOrders,
  getAccountInfo,
  getMinWalletBalance,
  getExecuteOrderTransactionsAsTakerFromOrderEntry,
  getAlgoandAsaAmounts,
  finalPriceCheck,
  getCutOrderTimes,
  getNumeratorAndDenominatorFromPrice,
  getPlaceASAToSellASAOrderIntoOrderbookV2,
  getPlaceAlgosToBuyASAOrderIntoOrderbookV2,
  dumpVar,
} = require('../functions/base');
/**
 * @example
 *       RawOrder:{
 *          const {
 *           escrowAddress,
 *           ownerAddress,
 *           price: D/N
 *           N,
 *           D,
 *           assetId,
 *           version
 *         } = cellData.metadata
 *       }
 *
 *       order: {
 *         // Order
 *         type: 'buy',
 *         amount: '',
 *         total: '0',
 *         execution: 'maker' | 'taker' | 'market'
 *         asset: {
 *           id: 123124124,
 *           decimals: 10,
 *         }
 *         // Price
 *         price: this.D/this.N,
 *         N: 1223
 *         D: 1232
 *
 *         // Wallets
 *         to: wallet addr string || escrow addr string
 *         from: wallet addr string || escrow addr string
 *
 *       },
 *       wallet: {
 *         address: "123123123213"
 *         algo: {
 *           balance: 12312312
 *         },
 *         assets: {
 *           123124124: {
 *             balance: 123123213
 *           }
 *         }
 *       }
 */

/**
 * @todo: Replace other functions with this
 * @todo: Accept standard Order Object
 * @todo: Accept Params
 * @todo: Accept Wallet
 * @param algodClient
 * @param isSellingASA
 * @param assetId
 * @param userWalletAddr
 * @param limitPrice
 * @param orderAssetAmount
 * @param orderAlgoAmount
 * @param allOrderBookOrders
 * @param includeMaker
 * @param walletConnector
 * @return {Promise<Array<OuterTxn>>}
 */
async function structure(algodClient, {isSellingASA, assetId,
  userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker}, wallet) {
  // IF we are closing an order, see https://github.com/algodex/algodex-react/blob/next/components/Wallet/Table/OpenOrdersTable.jsx#L73
  // to convert the Order Object to the closeOrder orderBookEntry parameter. Prefer to remove orderBookEntry in
  // favor of order having N and D


  console.debug('in structureOrder');
  ee.emit('order-something-event', {assetId});
  let queuedOrders = getQueuedTakerOrders(userWalletAddr, isSellingASA, allOrderBookOrders);
  const allTransList = [];
  const transNeededUserSigList = [];
  const execAccountInfo = await getAccountInfo(userWalletAddr);

  const alreadyOptedIn = false;
  console.debug('herezz56');
  console.debug({execAccountInfo});

  // const takerMinBalance = await getMinWalletBalance(execAccountInfo, true);
  const takerMinBalance = await getMinWalletBalance(execAccountInfo, true);

  console.debug({min_bal: takerMinBalance});

  let walletAssetAmount = 0;
  const walletAlgoAmount = execAccountInfo['amount'] - takerMinBalance - (0.004 * 1000000);
  if (walletAlgoAmount <= 0) {
    console.debug('not enough to trade!! returning early');
    return;
  }

  if (execAccountInfo != null && execAccountInfo['assets'] != null &&
    execAccountInfo['assets'].length > 0) {
    for (let i = 0; i < execAccountInfo['assets'].length; i++) {
      const asset = execAccountInfo['assets'][i];
      if (asset['asset-id'] === assetId) {
        walletAssetAmount = asset['amount'];
        break;
        // console.debug("execAccountInfo: " + execAccountInfo);
      }
    }
  }

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
  const takerIsOptedIn = getTakerOptedIn(execAccountInfo, assetId);

  orderAssetAmount = Math.max(1, orderAssetAmount);
  orderAlgoAmount = Math.max(1, orderAlgoAmount);


  if (isSellingASA) {
    // we are selling an ASA so check wallet balance
    orderAlgoBalance = walletAlgoAmount;
    orderAssetBalance = Math.min(orderAssetAmount, walletAssetAmount);
  } else {
    // wallet ASA balance doesn't matter since we are selling algos
    orderAlgoBalance = Math.min(orderAlgoAmount, walletAlgoAmount);
    orderAssetBalance = walletAssetAmount;
  }

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

  // let walletBalance = 10; // wallet balance
  // let walletASABalance = 15;
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

  // console.debug("queued orders: ", dumpVar(queuedOrders));
  const params = await algodClient.getTransactionParams().do();
  let lastExecutedPrice = -1;


  for (let i = 0; i < queuedOrders.length; i++) {
    if (takerOrderBalance['orderAlgoAmount'] <= txnFee) {
      // Overspending issues
      continue;
    }

    if (isSellingASA && parseFloat(takerOrderBalance['asaBalance']) <= 0) {
      console.debug('breaking due to 0 asaBalance balance!');
      break;
    }
    if (!isSellingASA && parseFloat(takerOrderBalance['algoBalance']) <= 0) {
      console.debug('breaking due to 0 algoBalance balance!');
      break;
    }

    if (isSellingASA && parseFloat(takerOrderBalance['limitPrice']) > queuedOrders[i]['price']) {
      // buyer & seller prices don't match
      continue;
    }
    if (!isSellingASA && parseFloat(takerOrderBalance['limitPrice']) < queuedOrders[i]['price']) {
      // buyer & seller prices don't match
      continue;
    }


    // let cutOrder = null;
    // let splitTimes = 1;
    const getSplitTimesByIter = (i) => {
      let cutOrder = null;
      let splitTimes = 1;
      if (i === 0) {
        cutOrder = getCutOrderTimes(queuedOrders[i]);
        splitTimes = cutOrder.splitTimes;
      } else {
        cutOrder = null;
      }
      return {cutOrder, splitTimes};
    };
    const {cutOrder, splitTimes} = getSplitTimesByIter(i);

    console.debug('cutOrder, splitTimes: ', {cutOrder, splitTimes});
    let runningBalance = queuedOrders[i].isASAEscrow ? queuedOrders[i].asaBalance :
      queuedOrders[i].algoBalance;

    let outerBreak = false;
    for (let jj = 0; jj < splitTimes; jj++) {
      if (runningBalance <= 0) {
        throw new Error('Unexpected 0 or below balance');
      }
      console.debug('running balance: ' + runningBalance + ' isASAEscrow: ' + queuedOrders[i].isASAEscrow);
      const queuedOrder = Object.assign({}, queuedOrders[i]);

      if (cutOrder != null) {
        const shouldClose = (jj < cutOrder.splitTimes - 1) ? false : null;
        const useForceShouldCloseOrNot = (jj < cutOrder.splitTimes - 1);
        queuedOrder.forceShouldClose = shouldClose;
        queuedOrder.useForceShouldCloseOrNot = useForceShouldCloseOrNot;
        queuedOrder.txnNum = jj;

        if (jj >= splitTimes - 1) {
          // This is the last iteration, so simply use the running balance
          if (queuedOrder.isASAEscrow) {
            queuedOrder.asaBalance = runningBalance;
          } else {
            queuedOrder.algoBalance = runningBalance;
          }
        } else {
          if (queuedOrder.isASAEscrow) {
            queuedOrder.asaBalance = Math.min(cutOrder.cutOrderAmount, runningBalance);
          } else {
            queuedOrder.algoBalance = Math.min(cutOrder.cutOrderAmount, runningBalance);
          }
        }
      }
      const singleOrderTransList =
        await getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient,
            queuedOrder, takerOrderBalance, params, walletConnector);


      if (singleOrderTransList == null) {
        // Overspending issue
        outerBreak = true;
        break;
      }
      const [algo, asa] = getAlgoandAsaAmounts(singleOrderTransList);


      finalPriceCheck(algo, asa, limitPrice, isSellingASA);


      lastExecutedPrice = queuedOrder['price'];

      for (let k = 0; k < singleOrderTransList.length; k++) {
        const trans = singleOrderTransList[k];
        trans['txOrderNum'] = txOrderNum;
        trans['groupNum'] = groupNum;
        txOrderNum++;
        allTransList.push(trans);
        if (trans['needsUserSig'] === true) {
          transNeededUserSigList.push(trans);
        }
      }
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
    const numAndDenom = lastExecutedPrice !== -1 ? getNumeratorAndDenominatorFromPrice(lastExecutedPrice) :
      getNumeratorAndDenominatorFromPrice(limitPrice);
    const leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
    const leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
    console.debug('includeMaker is true');
    if (isSellingASA && leftoverASABalance > 0) {
      console.debug('leftover ASA balance is: ' + leftoverASABalance);

      makerTxns = await getPlaceASAToSellASAOrderIntoOrderbookV2(algodClient,
          userWalletAddr, numAndDenom.n, numAndDenom.d, 0, assetId, leftoverASABalance, false, walletConnector);
    } else if (!isSellingASA && leftoverAlgoBalance > 0) {
      console.debug('leftover Algo balance is: ' + leftoverASABalance);

      makerTxns = await getPlaceAlgosToBuyASAOrderIntoOrderbookV2(algodClient,
          userWalletAddr, numAndDenom.n, numAndDenom.d, 0, assetId, leftoverAlgoBalance, false, walletConnector);
    }
  }
  // below conditional handles output for getPlaceAlgos when signAndSend is false so returns unsigned Lsig
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

  return {params, allTransList};
}
module.exports = structure;
