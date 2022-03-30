// const structure = require('../txns/structure.js');
// const {
//   getPlaceAlgosToBuyASAOrderIntoOrderbookV2,
//   getPlaceASAToSellASAOrderIntoOrderbookV2,
//   closeOrderFromOrderBookEntry,
// } = require('../functions/base');
// const {
//   signWalletConnectTransactions,
//   signMyAlgoTransactions,
//   propogateTransactions,
// } = require('../wallet/signing_api.js');
// const deprecate = require('../utils/deprecate');

const {
  getQueuedTakerOrders, getAccountInfo, getMinWalletBalance, dumpVar,
  getCutOrderTimes, getExecuteOrderTransactionsAsTakerFromOrderEntry,
  getAlgoandAsaAmounts, finalPriceCheck, getNumeratorAndDenominatorFromPrice,
  getPlaceASAToSellASAOrderIntoOrderbook,
  getPlaceAlgosToBuyASAOrderIntoOrderbook, signAndSendWalletConnectTransactions,
  printTransactionDebug, waitForConfirmation, allSettled,
} = require('../functions/base');
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
async function execute(
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
  const execAccountInfo = await getAccountInfo(userWalletAddr);
  // const alreadyOptedIn = false;
  console.debug('herezz56');
  console.debug({execAccountInfo});

  const takerMinBalance = await getMinWalletBalance(
      execAccountInfo,
      true,
  );

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
  let orderAlgoBalance; let orderAssetBalance;
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

  // console.debug("queued orders: ", umpVar(queuedOrders));
  const params = await algodClient.getTransactionParams().do();
  let lastExecutedPrice = -1;

  // const getCutOrderTimes = getCutOrderTimes;
  // above declaration is unneeded

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

    if (
      isSellingASA &&
      parseFloat(takerOrderBalance['limitPrice']) > queuedOrders[i]['price']
    ) {
      // buyer & seller prices don't match
      continue;
    }
    if (
      !isSellingASA &&
      parseFloat(takerOrderBalance['limitPrice']) < queuedOrders[i]['price']
    ) {
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
    let runningBalance = queuedOrders[i].isASAEscrow ?
      queuedOrders[i].asaBalance :
      queuedOrders[i].algoBalance;

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
            queuedOrder.asaBalance = Math.min(
                cutOrder.cutOrderAmount,
                runningBalance,
            );
          } else {
            queuedOrder.algoBalance = Math.min(
                cutOrder.cutOrderAmount,
                runningBalance,
            );
          }
        }
      }
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
  // TODO: Fixme!!!
  if (!!walletConnector && walletConnector.connector.connected) {
    return await signAndSendWalletConnectTransactions(
        algodClient,
        allTransList,
        params,
        walletConnector,
    );
  }
  // TODO: Fixme!!
  const connector = require('../wallet/connectors/MyAlgoConnect');
  let signedTxns = await connector.signTransaction(txnsForSigning);

  if (!Array.isArray(signedTxns)) {
    signedTxns = [signedTxns];
  }

  for (let i = 0; i < transNeededUserSigList.length; i++) {
    transNeededUserSigList[i]['signedTxn'] = signedTxns[i].blob;
  }
  signedTxns = [];
  const sentTxns = [];

  let lastGroupNum = -1;
  for (let i = 0; i < allTransList.length; i++) { // loop to end of array
    if (lastGroupNum !== allTransList[i]['groupNum']) {
      // If at beginning of new group, send last batch of transactions
      if (signedTxns.length > 0) {
        try {
          printTransactionDebug(signedTxns);
          const txn = await algodClient.sendRawTransaction(signedTxns).do();
          sentTxns.push(txn.txId);
          console.debug('sent: ' + txn.txId);
        } catch (e) {
          console.debug(e);
        }
      }
      // send batch of grouped transactions
      signedTxns = [];
      lastGroupNum = allTransList[i]['groupNum'];
    }

    signedTxns.push(allTransList[i]['signedTxn']);

    if (i === allTransList.length - 1) {
      // If at end of list send last batch of transactions
      if (signedTxns.length > 0) {
        try {
          printTransactionDebug(signedTxns);
          const DO_SEND = true;
          if (DO_SEND) {
            const txn = await algodClient.sendRawTransaction(signedTxns).do();
            sentTxns.push(txn.txId);
            console.debug('sent: ' + txn.txId);
          } else {
            console.debug('skipping sending for debugging reasons!!!');
          }
        } catch (e) {
          console.debug(e);
        }
      }
      break;
    }
  }

  console.debug('going to wait for confirmations');

  const waitConfirmedPromises = [];

  for (let i = 0; i < sentTxns.length; i++) {
    console.debug('creating promise to wait for: ' + sentTxns[i]);
    const confirmPromise = waitForConfirmation(sentTxns[i]);
    waitConfirmedPromises.push(confirmPromise);
  }

  console.debug('final9 trans are: ');
  // console.debug(alTransList);
  // console.debug(transNeededUserSigList);

  console.debug('going to send all ');

  const confirmedTransactions = await allSettled(waitConfirmedPromises);

  const transResults = JSON.stringify(confirmedTransactions, null, 2);
  console.debug('trans results after confirmed are: ');
  console.debug(transResults);
  // await waitForConfirmation(algodClient, txn.txId);
  // await waitForConfirmation(algodClient, txn.txId )
}

module.exports = execute;
// const Execute = {
//
//   /**
//    * Executes a limit order as a taker and submits it to the blockchain
//    *
//    * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
//    * @param {Boolean} isSellingASA_AsTakerOrder: boolean true if the taker is selling the ASA to an ALGO-only escrow buy order
//    * @param {Number}                    assetId: Algorand ASA ID for the asset.
//    * @param {String}            takerWalletAddr: public address of the taker's wallet address
//    * @param {Number}                 limitPrice: price of the base unit ASA in terms of microALGO
//    * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
//    * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
//    * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
//    * @return {Object} Promise for when the batched transaction(s) are fully confirmed
//    * @deprecated
//    */
//   executeOrderAsTaker: async function(
//       algodClient,
//       isSellingASA_AsTakerOrder,
//       assetId,
//       takerWalletAddr,
//       limitPrice,
//       orderAssetAmount,
//       orderAlgoAmount,
//       allOrderBookOrders,
//       walletConnector,
//   ) {
//     const {
//       params,
//       allTransList,
//     } = await structure(algodClient, isSellingASA_AsTakerOrder, assetId,
//         takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);
//
//     // Check if connection is already established
//     if (!walletConnector.connected) {
//       throw new Error('Wallet not connected!!!');
//     }
//     await walletConnector.sign(algodClient, allTransList, params, walletConnector);
//     // if (!!walletConnector && walletConnector.connector.connected) {
//     //   const signedGroupTransactions = await signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
//     //   const confirmedWalletConnectArr = await propogateTransactions(algodClient, signedGroupTransactions);
//     //   return confirmedWalletConnectArr;
//     // } else {
//     //   const signedGroupedTransactions = await signMyAlgoTransactions(allTransList);
//     //   const confirmedMyAlgoWalletArr = await propogateTransactions(algodClient, signedGroupedTransactions);
//     //   return confirmedMyAlgoWalletArr;
//     // }
//   },
//   /**
//    * Executes a market order as a taker and submits it to the blockchain
//    *
//    * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
//    * @param {Boolean} isSellingASA_AsTakerOrder: boolean true if the taker is selling the ASA to an ALGO-only escrow buy order
//    * @param {Number}                    assetId: Algorand ASA ID for the asset.
//    * @param {String}            takerWalletAddr: public address of the taker's wallet address
//    * @param {Number}                 currentMarketPrice: market price of the base unit ASA in terms of microALGO
//    * @param {Number}                 worstAcceptablePrice: price of the base unit ASA in terms of microALGO after accounting for tolerance
//    * @param {Number}                 tolerance: float from 0-1
//    * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
//    * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
//    * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
//    * @returns {Object} Promise for when the batched transaction(s) are fully confirmed
//    * @deprecated
//    */
//
//   executeMarketOrderAsTaker: async function(algodClient, isSellingASA_AsTakerOrder, assetId,
//       takerWalletAddr, currentMarketPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector, tolerance = .20) {
//     const worstAcceptablePrice = isSellingASA_AsTakerOrder ? currentMarketPrice * (1 - tolerance) : currentMarketPrice * (1 + tolerance);
//
//     const {
//       params,
//       allTransList,
//     } = await structure(algodClient, isSellingASA_AsTakerOrder, assetId,
//         takerWalletAddr, worstAcceptablePrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);
//
//     if (!!walletConnector && walletConnector.connector.connected) {
//       const signedGroupTransactions = await signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
//       const confirmedWalletConnectArr = await propogateTransactions(algodClient, signedGroupTransactions);
//       return confirmedWalletConnectArr;
//     } else {
//       const singedGroupedTransactions = await signMyAlgoTransactions(allTransList);
//       const confirmedMyAlgoWalletArr = await propogateTransactions(algodClient, singedGroupedTransactions);
//       return confirmedMyAlgoWalletArr;
//     }
//   },
//
//   /**
//    * Executes a limit order as a maker and taker and submits it to the blockchain
//    *
//    * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
//    * @param {Boolean}              isSellingASA: boolean true if the user is selling the ASA
//    * @param {Number}                    assetId: Algorand ASA ID for the asset.
//    * @param {String}            userWalletAddr: public address of the taker/maker's wallet address
//    * @param {Number}                 limitPrice: price of the base unit ASA in terms of microALGO
//    * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
//    * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
//    * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
//    * @returns {Object} Promise for when the batched transaction(s) are fully confirmed
//    * @deprecated
//    */
//
//   executeOrderAsMakerAndTaker: async function(algodClient, isSellingASA, assetId,
//       userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector) {
//     const {params, allTransList} = await structure(
//         algodClient,
//         {
//           isSellingASA,
//           assetId,
//           userWalletAddr,
//           limitPrice,
//           orderAssetAmount,
//           orderAlgoAmount,
//           allOrderBookOrders,
//           includeMaker: true,
//         },
//         walletConnector,
//     );
//
//     if (!!walletConnector && walletConnector.connector.connected) {
//       const signedGroupTransactions = await signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
//       const confirmedWalletConnectArr = await propogateTransactions(algodClient, signedGroupTransactions);
//       return confirmedWalletConnectArr;
//     } else {
//       const signedGroupedTransactions = await signMyAlgoTransactions(allTransList);
//       const confirmedMyAlgoWalletArr = await propogateTransactions(algodClient, signedGroupedTransactions);
//       return confirmedMyAlgoWalletArr;
//     }
//   },
//
//   /**
//    * @deprecated
//    */
//   closeOrderFromOrderBookEntry: closeOrderFromOrderBookEntry,
//
//   /**
//    * Maker order to create a new algo-only escrow account and order book entry
//    * Note: use getNumeratorAndDenominatorFromPrice() to get the n and d values.
//    *
//    * @param {Object}     algodClient: object that has been initialized via initAlgodClient()
//    * @param {String} makerWalletAddr: external wallet address of the user placing the order. Used to sign with My Algo
//    * @param {Number}               n: numerator   of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
//    * @param {Number}               d: denominator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
//    * @param {Number}         assetId: Algorand ASA ID for the asset.
//    * @param {Number}   algoOrderSize: size of the order in terms of algos
//    * @returns {Object} Promise for when the transaction is fully confirmed
//    * @deprecated
//    */
//
//   placeAlgosToBuyASAOrderIntoOrderbook: function(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, walletConnector) {
//     return getPlaceAlgosToBuyASAOrderIntoOrderbookV2(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, true, walletConnector);
//   },
//
//   /**
//    * Maker order to create a new algo-only escrow account and order book entry
//    * Note: use getNumeratorAndDenominatorFromPrice() to get the n and d values.
//    *
//    * @param {String} makerWalletAddr: external wallet address of the user placing the order. Used to sign with My Algo
//    * @param {Number}               n: numerator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
//    * @param {Number}               d: denominator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
//    * @param {Number}             min: minimum execution amount size. Should always be set to 0 (for the time being).
//    * @param {Number}         assetId: Algorand ASA ID for the asset.
//    * @returns {Object} Promise for when the transaction is fully confirmed
//    * @deprecated
//    */
//
//   placeASAToSellASAOrderIntoOrderbook: function(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, walletConnector) {
//     return getPlaceASAToSellASAOrderIntoOrderbookV2(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, true, walletConnector);
//   },
//
// };
//
// /**
//  * Export of deprecated functions
//  */
// Object.keys(Execute).forEach((key) => {
//   Execute[key] = deprecate(Execute[key], {file: 'executeOrder.js'});
// });
//
// module.exports = Execute;
