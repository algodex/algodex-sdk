/**
 * @author Alexander Trefonas
 * @author Michael Feher
 * @author Eric Sharma
 *
 * @copyright 7/9/2021 Algodev Inc - All Rights Reserved.
 *
 *
 * Algodex API Interfaces
 *
 * This module is the sum of all work done for algodex v1 minus the Teal
 * transactions and generators. These are methods missing a namespace and can
 * move into a formal namespace over time. Namespaces include Order, Wallet,
 * Asset and Transaction. Namespaces should avoid the helper anti-pattern.
 *
 * All methods moved from this file should be replaced with a deprecated notice
 * such as the `deprecate()` utility function. Functions moved from this file
 * should be completely removed and replaced with the deprecated call of the new
 * function
 *
 * Example of "Move myOrderFunction to the Order namespace":
 *
 * Original File:
 * ```javascript
 * // base.js
 * function myOrderFunction(a,b,c,d,e){
 *
 * }
 *
 * module.exports = {
 *   myOrderFunction,
 * }
 * ```
 *
 * Refactored Namespace File:
 * ```javascript
 * //../Order/myOrderFunction.js
 * // myOrderFunction now accepts an object instead of many parameters
 * function myOrderFunction({a,b,c,d,e}){
 *
 * }
 * ```
 *
 * Refactored Base File:
 * ```javascript
 * // base.js
 * const myOrderFunction = require('../Order/myOrderFunction.js')
 *
 * module.exports = {
 *   myOrderFunction: deprecate(myOrderFunction),
 * }
 *
 * ```
 */

// Third Party
const algosdk = require('algosdk');
const BigN = require('js-big-decimal');
// const TextEncoder = require('text-encoding').TextEncoder;
const axios = require('axios').default;
const {formatJsonRpcRequest} = require('@json-rpc-tools/utils');
const {isUndefined} = require('lodash/lang');

// Templates
const algoDelegateTemplate = require(
    '../teal/templates/ALGO_Delegate.template.teal',
);
const algoDelegateTemplateV4 = require(
    '../teal/templates/ALGO_Delegate_v4.template.teal',
);
const algoDelegateTemplateV5 = require(
    '../teal/templates/ALGO_Delegate_v5.template.teal',
);
const algoDelegateTemplateV6 = require(
    '../teal/templates/ALGO_Delegate_v6.template.teal',
);
const algoDelegateTemplateV7 = require(
    '../teal/templates/ALGO_Delegate_v7.template.teal',
);
const asaDelegateTemplate = require(
    '../teal/templates/ASA_Delegate.template.teal',
);
const asaDelegateTemplateV4 = require(
    '../teal/templates/ASA_Delegate_v4.template.teal',
);
const asaDelegateTemplateV5 = require(
    '../teal/templates/ASA_Delegate_v5.template.teal',
);
const asaDelegateTemplateV6 = require(
    '../teal/templates/ASA_Delegate_v6.template.teal',
);
// const asaDelegateTemplateV7 = require(
// '../teal/templates/ASA_Delegate_v7.template.teal
// ');

// Internal
// TODO: Remove signing calls
const signingApi = require('../wallet/signing_api.js');

// TODO: Remove state from constants
const constants = require('../constants.js');

const LESS_THAN = -1;
const GREATER_THAN = 1;

// TODO Remove Module State
let ALGO_ESCROW_ORDER_BOOK_ID = -1;
// TODO Remove Module State
let ASA_ESCROW_ORDER_BOOK_ID = -1;

// TODO Remove Module State
let ALGOD_INDEXER_SERVER = constants.TEST_INDEXER_SERVER;
// TODO Remove Module State
let ALGOD_INDEXER_PORT = constants.TEST_INDEXER_PORT;
// TODO Remove Module State
let ALGOD_INDEXER_TOKEN = constants.TEST_INDEXER_TOKEN;
// TODO Remove Module State
let compilationResults = {};


/**
 * @typedef import('algosdk').Algodv2
 * @typedef import('algosdk').Indexer Indexer
 */


/**
 * # Do AlertInternal
 *
 * Deprecated Alert Function, should not be used. Developers should
 * prefer using alert() if necessary. The abstraction is management overhead
 *
 * @deprecated
 */
function doAlertInternal() {
  alert(2);
  console.debug('internal api call!!!');
}

/**
 * # Do Alert
 *
 * Deprecated Alert Function, should not be used. Developers should
 * prefer using alert() if necessary. The abstraction is management overhead
 *
 * @deprecated
 */
function doAlert() {
  alert(1);
  console.debug('api call!!!');
}

/**
 * @deprecated
 * @return {Object}
 */
function getConstants() {
  return constants;
}

/**
 *
 * @param {Array<Promise>} promises
 * @return {Promise<Array>}
 */
function allSettled(promises) {
  return Promise.all(
      promises.map((p) => Promise.resolve(p)
          .then(
              (val) => ({status: 'promiseFulfilled', value: val}),
              (err) => ({status: 'promiseRejected', reason: err}))),
  );
}

/**
 *  @deprecated
 *  @param {string} environment
 *  @throws TypeError
 */
function initSmartContracts(environment) {
  if (environment === 'local') {
    ALGO_ESCROW_ORDER_BOOK_ID = constants.LOCAL_ALGO_ORDERBOOK_APPID;
    ASA_ESCROW_ORDER_BOOK_ID = constants.LOCAL_ASA_ORDERBOOK_APPID;
  } else if (environment === 'test') {
    ALGO_ESCROW_ORDER_BOOK_ID = constants.TEST_ALGO_ORDERBOOK_APPID;
    ASA_ESCROW_ORDER_BOOK_ID = constants.TEST_ASA_ORDERBOOK_APPID;
  } else if (environment === 'public_test') {
    ALGO_ESCROW_ORDER_BOOK_ID = constants.PUBLIC_TEST_ALGO_ORDERBOOK_APPID;
    ASA_ESCROW_ORDER_BOOK_ID = constants.PUBLIC_TEST_ASA_ORDERBOOK_APPID;
  } else if (environment === 'production') {
    ALGO_ESCROW_ORDER_BOOK_ID = constants.PROD_ALGO_ORDERBOOK_APPID;
    ASA_ESCROW_ORDER_BOOK_ID = constants.PROD_ASA_ORDERBOOK_APPID;
  } else {
    throw new TypeError('environment must be local, test, or production');
  }
  if ('ALGODEX_ALGO_ESCROW_APP' in process.env) {
    ALGO_ESCROW_ORDER_BOOK_ID = parseInt(process.env.ALGODEX_ALGO_ESCROW_APP);
  }
  if ('ALGODEX_ASA_ESCROW_APP' in process.env) {
    ASA_ESCROW_ORDER_BOOK_ID = parseInt(process.env.ALGODEX_ASA_ESCROW_APP);
  }
  // console.debug("ALGO APP ID:", ALGO_ESCROW_ORDER_BOOK_ID)
  // console.debug("ASA APP ID:", ASA_ESCROW_ORDER_BOOK_ID)

  initSmartContractsInternal(
      ALGO_ESCROW_ORDER_BOOK_ID,
      ASA_ESCROW_ORDER_BOOK_ID,
  );
  // console.debug({ALGO_ESCROW_ORDER_BOOK_ID, ASA_ESCROW_ORDER_BOOK_ID});
}
/**
 * @deprecated
 * @param {number} algoOrderBookId
 * @param {number} asaOrderBookId
 */
function initSmartContractsInternal(
    algoOrderBookId,
    asaOrderBookId,
) {
  ALGO_ESCROW_ORDER_BOOK_ID = algoOrderBookId;
  ASA_ESCROW_ORDER_BOOK_ID = asaOrderBookId;
}


/**
 *
 * @param {boolean} isAlgoEscrowApp
 * @return {number}
 * @deprecated
 */
function getOrderBookId(isAlgoEscrowApp) {
  if (isAlgoEscrowApp) {
    return ALGO_ESCROW_ORDER_BOOK_ID;
  }
  return ASA_ESCROW_ORDER_BOOK_ID;
}

/**
 *
 * @param {Object} accountInfo
 * @param {boolean} includesFullAccountInfo
 * @return {Promise<number>}
 */
async function getMinWalletBalance(
    accountInfo,
    includesFullAccountInfo = false,
) {
  if (!includesFullAccountInfo) {
    try {
      // get full account info
      accountInfo = await getAccountInfo(accountInfo.address);
    } catch (e) {
      return 1000000;
    }
  }
  if (!accountInfo || !accountInfo.address) {
    return 1000000;
  }
  console.debug('in getMinWalletBalance. Checking: ' + accountInfo.address);
  console.debug({accountInfo});

  let minBalance = 0;

  if (accountInfo['created-apps']) {
    minBalance += 100000 * (accountInfo['created-apps'].length); // Apps
  }
  if (accountInfo['assets']) {
    minBalance += accountInfo['assets'].length * 100000;
  }
  if (
    !isUndefined(accountInfo['apps-total-schema']) &&
    accountInfo['apps-total-schema']['num-uint']
  ) {
    // Total Ints
    minBalance += (25000+3500) * accountInfo['apps-total-schema']['num-uint'];
  }
  if (
    !isUndefined(accountInfo['apps-total-schema']) &&
    accountInfo['apps-total-schema']['num-byte-slice']
  ) {
    const numByteSlice = accountInfo['apps-total-schema']['num-byte-slice'];
    minBalance += (25000+25000) * numByteSlice; // Total Bytes
  }
  minBalance += 1000000;

  return minBalance;
}

/**
 * @param {string} environment
 * @return {Indexer}
 * @deprecated
 */
function initIndexer(environment) {
  let server = null;
  let port = null;
  let token = null;

  initSmartContracts(environment);

  if (environment === 'local') {
    server = constants.LOCAL_INDEXER_SERVER;
    port = constants.LOCAL_INDEXER_PORT;
    token = constants.LOCAL_INDEXER_TOKEN;
  } else if (environment === 'test') {
    server = constants.TEST_INDEXER_SERVER;
    port = constants.TEST_INDEXER_PORT;
    token = constants.TEST_INDEXER_TOKEN;
  } else if (environment === 'public_test') {
    server = constants.PUBLIC_TEST_INDEXER_SERVER;
    port = constants.PUBLIC_TEST_INDEXER_PORT;
    token = constants.PUBLIC_TEST_INDEXER_TOKEN;
  } else if (environment === 'production') {
    server = constants.PROD_INDEXER_SERVER;
    port = constants.PROD_INDEXER_PORT;
    token = constants.PROD_INDEXER_TOKEN;
  } else {
    throw new TypeError('environment must be local, test, or production');
  }

  const indexerClient = new algosdk.Indexer(token, server, port);
  console.debug({server, port, token});

  setAlgodIndexer(server, port, token);

  return indexerClient;
}

/**
 *
 * @param {string} environment One of local, test, production
 * @return {Algodv2}
 * @deprecated
 */
function initAlgodClient(environment) {
  let algodServer = null;
  let port = null;
  let token = null;


  initSmartContracts(environment);

  if (environment === 'local') {
    algodServer = constants.LOCAL_ALGOD_SERVER;
    port = constants.LOCAL_ALGOD_PORT;
    token = constants.LOCAL_ALGOD_TOKEN;
  } else if (environment === 'test') {
    algodServer = constants.TEST_ALGOD_SERVER;
    port = constants.TEST_ALGOD_PORT;
    token = constants.TEST_ALGOD_TOKEN;
  } else if (environment === 'public_test') {
    algodServer = constants.PUBLIC_TEST_ALGOD_SERVER;
    port = constants.PUBLIC_TEST_ALGOD_PORT;
    token = constants.PUBLIC_TEST_ALGOD_TOKEN;
  } else if (environment === 'production') {
    algodServer = constants.PROD_ALGOD_SERVER;
    port = constants.PROD_ALGOD_PORT;
    token = constants.PROD_ALGOD_TOKEN;
  } else {
    throw 'environment must be local, test, or production';
  }
  // console.debug({server: algodServer, token, port});
  const algodClient = new algosdk.Algodv2(token, algodServer, port);

  // May need to define these three functions outside of module.exports
  setAlgodServer(algodServer);
  setAlgodPort(port);
  setAlgodToken(token);

  return algodClient;
}

/**
 * Wait for a transaction to be confirmed
 * @param {string} txId
 * @return {Promise<{statusMsg: string, txId, transaction: *, status: string}>}
 * @throws Error
 */
async function waitForConfirmation(txId) {
  /**
   * @param {*} ms
   * @return {Promise<unknown>}
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const maxLoops = 25;
  let loopCount = 0;

  while (loopCount < maxLoops) {
    // Check the pending transactions
    const port = (ALGOD_INDEXER_PORT) ? ':' + ALGOD_INDEXER_PORT : '';
    let response = null;
    let isError = false;

    try {
      const url = ALGOD_INDEXER_SERVER +
        port +
        '/v2/transactions/' +
        txId;

      response = await axios.get(
          url,
          {headers: {'X-Algo-API-Token': ALGOD_INDEXER_TOKEN}},
      );
    } catch (e) {
      isError = true;
    }
    if (
      response == null ||
      response.data == null ||
      response.data.transaction == null
    ) {
      isError = true;
    }

    if (!isError) {
      const txnInfo = response.data.transaction;

      if (
        txnInfo['confirmed-round'] !== null &&
        txnInfo['confirmed-round'] > 0
      ) {
        // Got the completed Transaction
        console.debug(
            `Transaction ${txId} confirmed in round ${txnInfo['confirmed-round']}`,
        );

        return {
          txId,
          status: 'confirmed',
          statusMsg: `Transaction confirmed in round ${txnInfo['confirmed-round']}`,
          transaction: txnInfo,
        };
      }
      if (txnInfo['pool-error'] !== null && txnInfo['pool-error'].length > 0) {
        // transaction has been rejected
        return {
          txId,
          status: 'rejected',
          statusMsg: 'Transaction rejected due to pool error',
          transaction: txnInfo,
        };
      }
    }

    await sleep(1000); // sleep a second
    loopCount++;
  }

  throw new Error(`Transaction ${txId} timed out`);
}

/**
 *
 * @param {number} limitPrice
 * @return {object}
 */
function getNumeratorAndDenominatorFromPrice(limitPrice) {
  const countDecimals = function(limitPrice) {
    if (Math.floor(limitPrice) === limitPrice) return 0;
    return limitPrice.toString().split('.')[1].length || 0;
  };

  const origDecCount = countDecimals(limitPrice);
  let d = 10**origDecCount * limitPrice;
  let n = 10**origDecCount;
  d = Math.round(d);
  n = Math.round(n);

  return {
    n: n,
    d: d,
  };
}

/**
 *
 * @param {*} blockChainOrderVal
 * @param {*} price
 * @param {*} n
 * @param {*} d
 * @param {*} min
 * @param {*} escrowAddr
 * @param {*} algoBalance
 * @param {*} asaBalance
 * @param {*} escrowOrderType
 * @param {*} isASAEscrow
 * @param {*} orderCreatorAddr
 * @param {*} assetId
 * @param {*} version
 * @return {Object}
 */
function createOrderBookEntryObj(
    blockChainOrderVal,
    price,
    n,
    d,
    min,
    escrowAddr,
    algoBalance,
    asaBalance,
    escrowOrderType,
    isASAEscrow,
    orderCreatorAddr,
    assetId,
    version = 3,
) {
  return {
    // this should match what's in the blockchain
    orderEntry: blockChainOrderVal,
    price: price, // d/n
    n: n,
    d: d,
    min: min,
    escrowAddr: escrowAddr,
    algoBalance: algoBalance,
    asaBalance: asaBalance,
    escrowOrderType: escrowOrderType,
    isASAEscrow: isASAEscrow,
    orderCreatorAddr: orderCreatorAddr,
    assetId: assetId,
    version: version,
  };
}

/**
 * @param {Object} queuedOrder
 * @return {object}
 */
function getCutOrderTimes(queuedOrder) {
  console.debug('in getCutOrderTimes: ', JSON.stringify(queuedOrder));
  let cutOrderAmount = null; let splitTimes = null;
  if (queuedOrder.isASAEscrow) {
    cutOrderAmount = Math.max(1, queuedOrder.asaBalance / 4);
    splitTimes = Math.floor(queuedOrder.asaBalance / cutOrderAmount);
  } else {
    const minOrderAmount = Math.max(queuedOrder.price + 1, 500000);
    cutOrderAmount = Math.max(minOrderAmount, queuedOrder.algoBalance / 4);
    splitTimes = Math.floor(queuedOrder.algoBalance / cutOrderAmount);
  }
  cutOrderAmount = Math.floor(cutOrderAmount);

  if (splitTimes === 0) {
    splitTimes = 1;
  }

  return {
    'cutOrderAmount': cutOrderAmount,
    'splitTimes': splitTimes,
  };
}
/**
 * TODO: use toString prototypes or logger
 * @param {*} x
 * @return {string}
 * @deprecated
 */
function dumpVar(x) {
  return JSON.stringify(x, null, 2);
}

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
async function executeOrder(
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

/**
 * @deprecated
 * @param algodClient
 * @param makerWalletAddr
 * @param n
 * @param d
 * @param min
 * @param assetId
 * @param algoOrderSize
 * @param signAndSend
 * @param walletConnector
 * @return {Promise<*[]|*>}
 */
async function getPlaceAlgosToBuyASAOrderIntoOrderbookV2(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, signAndSend, walletConnector) {
  console.debug('placeAlgosToBuyASAOrderIntoOrderbook makerWalletAddr, n, d, min, assetId',
      makerWalletAddr, n, d, min, assetId);
  const program = buildDelegateTemplateFromArgs(min, assetId, n, d, makerWalletAddr, false, constants.ESCROW_CONTRACT_VERSION);

  const lsig = await getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
  const generatedOrderEntry = generateOrder(makerWalletAddr, n, d, min, assetId);
  console.debug('address is: ' + lsig.address());
  console.debug('here111 generatedOrderEntry ' + generatedOrderEntry);
  // check if the lsig has already opted in
  const alreadyOptedIntoOrderbook = false;
  const makerAccountInfo = await getAccountInfo(makerWalletAddr);
  let makerAlreadyOptedIntoASA = false;
  if (makerAccountInfo != null && makerAccountInfo['assets'] != null &&
    makerAccountInfo['assets'].length > 0) {
    for (let i = 0; i < makerAccountInfo['assets'].length; i++) {
      if (makerAccountInfo['assets'][i]['asset-id'] === assetId) {
        makerAlreadyOptedIntoASA = true;
        break;
      }
    }
  }


  console.debug({makerAlreadyOptedIntoASA});
  console.debug({alreadyOptedIntoOrderbook});

  if (alreadyOptedIntoOrderbook == false && algoOrderSize < constants.MIN_ASA_ESCROW_BALANCE) {
    algoOrderSize = constants.MIN_ASA_ESCROW_BALANCE;
  }
  console.debug('alreadyOptedIn: ' + alreadyOptedIntoOrderbook);
  // console.debug("acct info:" + JSON.stringify(escrowAccountInfo));

  const params = await algodClient.getTransactionParams().do();
  console.debug('sending trans to: ' + lsig.address());
  const txn = {
    ...params,
    type: 'pay',
    from: makerWalletAddr,
    to: lsig.address(),
    amount: parseInt(algoOrderSize), // the order size that gets stored into the contract account
  };

  const outerTxns = [];

  outerTxns.push({
    unsignedTxn: txn,
    needsUserSig: true,
  });

  myAlgoWalletUtil.setTransactionFee(txn);

  console.debug('here3 calling app from logic sig to open order');
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('open'));
  // console.debug("before slice: " + generatedOrderEntry);
  console.debug(generatedOrderEntry.slice(59));
  // console.debug("after slice: " + generatedOrderEntry.slice(59));

  appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
  // let arr = Uint8Array.from([0x2]);
  const arr = Uint8Array.from([constants.ESCROW_CONTRACT_VERSION]);
  appArgs.push(arr);
  console.debug('app args 2: ' + arr);
  // console.debug("owners bit addr: " + ownersBitAddr);
  // console.debug("herezzz_888");
  console.debug(appArgs.length);
  let logSigTrans = null;

  if (!alreadyOptedIntoOrderbook) {
    logSigTrans = await createTransactionFromLogicSig(algodClient, lsig,
        ALGO_ESCROW_ORDER_BOOK_ID, appArgs, 'appOptIn', params);
    outerTxns.push({
      unsignedTxn: logSigTrans,
      needsUserSig: false,
      lsig: lsig,
    });
  }
  // asset opt-in transfer
  let assetOptInTxn = null;

  if (!makerAlreadyOptedIntoASA) {
    assetOptInTxn = {
      type: 'axfer',
      from: makerWalletAddr,
      to: makerWalletAddr,
      amount: 0,
      assetIndex: assetId,
      ...params,
    };
    outerTxns.push({
      unsignedTxn: assetOptInTxn,
      needsUserSig: true,
    });
  }

  unsignedTxns = [];
  for (let i = 0; i < outerTxns.length; i++) {
    unsignedTxns.push(outerTxns[i].unsignedTxn);
  }


  const noteMetadata = {
    algoBalance: makerAccountInfo.amount,
    asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
    assetId: assetId,
    n: n,
    d: d,
    escrowAddr: lsig.address(),
    orderEntry: generatedOrderEntry,
    escrowOrderType: 'buy',
    version: constants.ESCROW_CONTRACT_VERSION,
  };
  // look into accuracy of above object

  unsignedTxns = formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, 'open', 'algo');

  if (signAndSend) {
    if (!!walletConnector && walletConnector.connector.connected) {
      const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector);
      return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
    } else {
      const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(outerTxns);
      return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
      // When we remove the signing of LSIGS from the other functions the signing of LSIG functionality found in this function can be moved to the new myAlgoSign function
    }
  }


  // if(!walletConnector || !walletConnector.connector.connected){assignGroups(unsignedTxns)};

  return outerTxns;
}
/**
 *
 * @param {*} algodClient
 * @param {*} escrowAccountAddr
 * @param {*} creatorAddr
 * @param {*} orderBookEntry
 * @param {*} version
 * @return {Promise<void>}
 */
async function closeOrderFromOrderBookEntry(
    algodClient,
    escrowAccountAddr,
    creatorAddr,
    orderBookEntry,
    version,
) {
  const valSplit = orderBookEntry.split('-');
  console.debug('closing order from order book entry!');
  console.debug('escrowAccountAddr, creatorAddr, orderBookEntry, version',
      escrowAccountAddr, creatorAddr, orderBookEntry, version);

  const n = valSplit[0];
  const d = valSplit[1];
  const min = valSplit[2];
  const assetid = valSplit[3];
  const infoForMetadata = {
    n,
    d,
    min,
    orderBookEntry,
    version,
  };
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('close'));
  appArgs.push(enc.encode(orderBookEntry));
  // appArgs.push(enc.encode(creatorAddr));
  console.debug('args length: ' + appArgs.length);
  const accountInfo = await getAccountInfo(escrowAccountAddr);
  let assetId = null;
  if (accountInfo != null && accountInfo['assets'] != null &&
        accountInfo['assets'].length > 0 && accountInfo['assets'][0] != null) {
    // check if escrow has an assetId in the blockchain
    assetId = accountInfo['assets'][0]['asset-id'];
  }
  const isAsaOrder = (assetId != null);


  const escrowSource = buildDelegateTemplateFromArgs(
      min,
      assetid,
      n,
      d,
      creatorAddr,
      isAsaOrder,
      version,
  );

  const lsig = await getLsigFromProgramSource(
      algosdk,
      algodClient,
      escrowSource,
      constants.DEBUG_SMART_CONTRACT_SOURCE,
  );
  console.debug('lsig is: ' + lsig.address());

  if (lsig.address() !== escrowAccountAddr) {
    throw new Error(
        'Lsig address does not equal input address! ' +
      lsig.address() +
      ' vs ' +
      escrowAccountAddr,
    );
  }

  if (assetId == null) {
    console.debug('closing order');
    await closeOrder(
        algodClient,
        escrowAccountAddr,
        creatorAddr,
        ALGO_ESCROW_ORDER_BOOK_ID,
        appArgs,
        lsig,
        infoForMetadata,
    );
  } else {
    console.debug('closing ASA order');
    await closeASAOrder(
        algodClient,
        escrowAccountAddr,
        creatorAddr,
        ASA_ESCROW_ORDER_BOOK_ID,
        appArgs,
        lsig,
        assetId,
        infoForMetadata,
    );
  }
}

/**
 *
 * @param {Array} txns
 */
function assignGroups(txns) {
  const groupID = algosdk.computeGroupID(txns);
  for (let i = 0; i < txns.length; i++) {
    txns[i].group = groupID;
  }
}

/**
 *
 * @param {number} algoAmount
 * @param {number} asaAmount
 * @param {number} limitPrice
 * @param {boolean} isSellingASA
 */
function finalPriceCheck(algoAmount, asaAmount, limitPrice, isSellingASA) {
  /**
   * @todo: Move to ../Errors
   * @param {string} message
   */
  function LimitPriceException(message) {
    this.message = message;
    this.name = 'LimitPriceException';
  }
  LimitPriceException.prototype = Error.prototype;
  const buyLimit = new BigN(limitPrice).multiply(new BigN(1.002));
  const sellLimit = new BigN(limitPrice).multiply(new BigN(0.998));

  if (
    !isSellingASA &&
    new BigN(algoAmount)
        .divide(new BigN(asaAmount))
        .compareTo(buyLimit) === GREATER_THAN
  ) {
    // Throw an exception if price is 0.2% higher than limit price set by user
    throw new LimitPriceException(
        'Attempting to buy at a price higher than limit price',
    );
  }
  if (
    isSellingASA &&
    new BigN(algoAmount)
        .divide(new BigN(asaAmount))
        .compareTo(sellLimit) === LESS_THAN
  ) {
    // Throw an exception if price is 0.2% lower than limit price set by user
    throw new LimitPriceException(
        'Attempting to sell at a price lower than limit price',
    );
  }
  console.debug({algoAmount, asaAmount, limitPrice});
}

/**
 * @param {Array} txnList
 * @return {Array}
 */
function getAlgoandAsaAmounts(txnList) {
  const algo = txnList
      .filter(
          (txObj) => {
            return Object.keys(txObj).includes('txType') &&
                    txObj.txType === 'algo';
          },
      )
      .map((txObj) => txObj.amount)[0];

  const asa = txnList
      .filter(
          (txObj) => {
            return Object.keys(txObj).includes('txType') &&
                    txObj.txType === 'asa';
          },
      )
      .map((txObj) => txObj.amount)[0];


  return [algo, asa];
}

/**
 *
 * @param {*} algodClient
 * @param {*} outerTxns
 * @param {*} params
 * @param {*} walletConnector
 * @return {Promise<Array>}
 */
async function signAndSendWalletConnectTransactions(
    algodClient,
    outerTxns,
    params,
    walletConnector,
) {
  // TODO: This should be a part of the OuterTxns/Transactions prototype
  // Example outerTxns.groupBy('key')
  const groupBy = (items, key) => items.reduce(
      (result, item) => ({
        ...result,
        [item[key]]: [
          ...(result[item[key]] || []),
          item,
        ],
      }),
      {},
  );
  const groups = groupBy(outerTxns, 'groupNum');

  const numberOfGroups = Object.keys(groups);

  const groupedGroups = numberOfGroups.map((group) => {
    const allTxFormatted = (groups[group].map((txn) => {
      if (!txn.unsignedTxn.name) {
        if (txn.unsignedTxn.type === 'pay') {
          return algosdk.makePaymentTxnWithSuggestedParams(
              txn.unsignedTxn.from,
              txn.unsignedTxn.to,
              txn.unsignedTxn.amount,
              undefined,
              undefined,
              params,
          );
        }
        if (txn.unsignedTxn.type === 'axfer') {
          return algosdk.makeAssetTransferTxnWithSuggestedParams(
              txn.unsignedTxn.from,
              txn.unsignedTxn.to,
              undefined,
              undefined,
              txn.unsignedTxn.amount,
              undefined,
              txn.unsignedTxn.assetIndex,
              params,
          );
        }
      } else {
        return txn.unsignedTxn;
      }
    }));
    algosdk.assignGroupID(allTxFormatted.map((toSign) => toSign));
    return allTxFormatted;
  },
  );

  const txnsToSign = groupedGroups.map((group) => {
    return group.map((txn) => {
      const encodedTxn = Buffer.from(
          algosdk.encodeUnsignedTransaction(txn),
      ).toString('base64');
      // TODO: Fixme!
      if (
        algosdk.encodeAddress(txn.from.publicKey) !== walletConnector.connector.accounts[0]
      ) {
        return {txn: encodedTxn, signers: []};
      }
      return {txn: encodedTxn};
    });
  });

  const formattedTxn = txnsToSign.flat();

  const request = formatJsonRpcRequest('algo_signTxn', [formattedTxn]);

  const result = await walletConnector.connector.sendCustomRequest(request);


  const resultsFormattted = result.map((element, idx) => {
    return element ? {
      txID: formattedTxn[idx].txn,
      blob: new Uint8Array(Buffer.from(element, 'base64')),
    } : {
      ...algosdk.signLogicSigTransactionObject(
          outerTxns[idx].unsignedTxn,
          outerTxns[idx].lsig,
      ),
    };
  });

  let orderedRawTransactions = resultsFormattted.map((obj) => obj.blob);

  for (let i = 0; i < outerTxns.length; i++) {
    outerTxns[i]['signedTxn'] = orderedRawTransactions[i];
  }

  let lastGroupNum = -1;
  orderedRawTransactions = [];
  const walletConnectSentTxn = [];
  for (let i = 0; i < outerTxns.length; i++) { // loop to end of array
    if (lastGroupNum !== outerTxns[i]['groupNum']) {
      // If at beginning of new group, send last batch of transactions
      if (orderedRawTransactions.length > 0) {
        try {
          printTransactionDebug(orderedRawTransactions);

          const txn = await algodClient.sendRawTransaction(
              orderedRawTransactions,
          ).do();
          walletConnectSentTxn.push(txn.txId);
          console.debug('sent: ' + txn.txId);
        } catch (e) {
          console.debug(e);
        }
      }
      // send batch of grouped transactions
      orderedRawTransactions = [];
      lastGroupNum = outerTxns[i]['groupNum'];
    }

    orderedRawTransactions.push(outerTxns[i]['signedTxn']);


    if (i === outerTxns.length - 1) {
      // If at end of list send last batch of transactions
      if (orderedRawTransactions.length > 0) {
        try {
          printTransactionDebug(orderedRawTransactions);
          const DO_SEND = true;
          if (DO_SEND) {
            const txn = await algodClient.sendRawTransaction(
                orderedRawTransactions,
            ).do();
            walletConnectSentTxn.push(txn.txId);
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

  return walletConnectSentTxn;
}

/**
 *
 * @param {Algodv2} algodClient
 * @param {*} outerTxns
 * @return {Promise<Object>}
 * @deprecated
 */
async function signAndSendTransactions(algodClient, outerTxns) {
  console.debug('inside signAndSend transactions');
  const txnsForSig = [];
  const txns = [];

  for (let i = 0; i < outerTxns.length; i++) {
    txns.push(outerTxns[i].unsignedTxn);
    if (outerTxns[i].needsUserSig === true) {
      txnsForSig.push(outerTxns[i].unsignedTxn);
    }
  }

  assignGroups(txns);

  // TODO: Fixme!
  const connector = require('../wallet/connectors/MyAlgoConnect');
  const signedTxnsFromUser = await connector.signTransaction(txnsForSig);

  if (Array.isArray(signedTxnsFromUser)) {
    let userSigIndex = 0;
    for (let i = 0; i < outerTxns.length; i++) {
      if (outerTxns[i].needsUserSig) {
        outerTxns[i].signedTxn = signedTxnsFromUser[userSigIndex].blob;
        userSigIndex++;
      }
    }
  } else {
    for (let i = 0; i < outerTxns.length; i++) {
      if (outerTxns[i].needsUserSig) {
        outerTxns[i].signedTxn = signedTxnsFromUser.blob;
        break;
      }
    }
  }

  for (let i = 0; i < outerTxns.length; i++) {
    if (!outerTxns[i].needsUserSig) {
      const signedLsig = algosdk.signLogicSigTransactionObject(
          outerTxns[i].unsignedTxn,
          outerTxns[i].lsig,
      );
      outerTxns[i].signedTxn = signedLsig.blob;
    }
  }

  const signed = [];

  for (let i = 0; i < outerTxns.length; i++) {
    signed.push(outerTxns[i].signedTxn);
  }
  console.debug('printing transaction debug');
  printTransactionDebug(signed);

  const groupTxn = await algodClient.sendRawTransaction(signed).do();
  return waitForConfirmation(groupTxn.txId);
}

/**
 *
 * @param {*} algodClient
 * @param {*} makerWalletAddr
 * @param {*} n
 * @param {*} d
 * @param {*} min
 * @param {*} assetId
 * @param {*} algoOrderSize
 * @param {*} signAndSend
 * @param {*} walletConnector
 * @return {Promise<Array>}
 */
async function getPlaceAlgosToBuyASAOrderIntoOrderbook(
    algodClient,
    makerWalletAddr,
    n,
    d,
    min,
    assetId,
    algoOrderSize,
    signAndSend,
    walletConnector,
) {
  console.debug(
      'placeAlgosToBuyASAOrderIntoOrderbook '+
      'makerWalletAddr, n, d, min, assetId',
      makerWalletAddr, n, d, min, assetId,
  );

  const program = buildDelegateTemplateFromArgs(
      min,
      assetId,
      n,
      d,
      makerWalletAddr,
      false,
      constants.ESCROW_CONTRACT_VERSION,
  );

  const lsig = await getLsigFromProgramSource(
      algosdk,
      algodClient,
      program,
      constants.DEBUG_SMART_CONTRACT_SOURCE,
  );
  const generatedOrderEntry = generateOrder(
      makerWalletAddr,
      n,
      d,
      min,
      assetId,
  );
  console.debug('address is: ' + lsig.address());
  console.debug('here111 generatedOrderEntry ' + generatedOrderEntry);
  // check if the lsig has already opted in
  const alreadyOptedIntoOrderbook = false;
  const makerAccountInfo = await getAccountInfo(makerWalletAddr);
  let makerAlreadyOptedIntoASA = false;
  if (makerAccountInfo != null && makerAccountInfo['assets'] != null &&
        makerAccountInfo['assets'].length > 0) {
    for (let i = 0; i < makerAccountInfo['assets'].length; i++) {
      if (makerAccountInfo['assets'][i]['asset-id'] === assetId) {
        makerAlreadyOptedIntoASA = true;
        break;
      }
    }
  }

  // let escrowAccountInfo = await getAccountInfo(lsig.address());

  // if (escrowAccountInfo != null && escrowAccountInfo['apps-local-state'] != null
  //         && escrowAccountInfo['apps-local-state'].length > 0
  //         && escrowAccountInfo['apps-local-state'][0].id == ALGO_ESCROW_ORDER_BOOK_ID) {
  //     alreadyOptedIntoOrderbook = true;
  // }

  console.debug({makerAlreadyOptedIntoASA});
  console.debug({alreadyOptedIntoOrderbook});

  if (
    alreadyOptedIntoOrderbook === false &&
    algoOrderSize < constants.MIN_ASA_ESCROW_BALANCE
  ) {
    algoOrderSize = constants.MIN_ASA_ESCROW_BALANCE;
  }
  console.debug('alreadyOptedIn: ' + alreadyOptedIntoOrderbook);
  // console.debug("acct info:" + JSON.stringify(escrowAccountInfo));

  const params = await algodClient.getTransactionParams().do();
  console.debug('sending trans to: ' + lsig.address());
  const txn = {
    ...params,
    type: 'pay',
    from: makerWalletAddr,
    to: lsig.address(),
    // the order size that gets stored into the contract account
    amount: parseInt(algoOrderSize),
  };

  const outerTxns = [];

  outerTxns.push({
    unsignedTxn: txn,
    needsUserSig: true,
  });

  // TODO: Fixme
  // myAlgoWalletUtil.setTransactionFee(txn);

  console.debug('here3 calling app from logic sig to open order');
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('open'));
  // console.debug("before slice: " + generatedOrderEntry);
  console.debug(generatedOrderEntry.slice(59));
  // console.debug("after slice: " + generatedOrderEntry.slice(59));

  appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
  // let arr = Uint8Array.from([0x2]);
  const arr = Uint8Array.from([constants.ESCROW_CONTRACT_VERSION]);
  appArgs.push(arr);
  console.debug('app args 2: ' + arr);
  // console.debug("owners bit addr: " + ownersBitAddr);
  // console.debug("herezzz_888");
  console.debug(appArgs.length);
  let logSigTrans = null;

  if (!alreadyOptedIntoOrderbook) {
    logSigTrans = await createTransactionFromLogicSig(algodClient, lsig,
        ALGO_ESCROW_ORDER_BOOK_ID, appArgs, 'appOptIn', params);
    outerTxns.push({
      unsignedTxn: logSigTrans,
      needsUserSig: false,
      lsig: lsig,
    });
  }
  // asset opt-in transfer
  let assetOptInTxn = null;

  if (!makerAlreadyOptedIntoASA) {
    assetOptInTxn = {
      type: 'axfer',
      from: makerWalletAddr,
      to: makerWalletAddr,
      amount: 0,
      assetIndex: assetId,
      ...params,
    };
    outerTxns.push({
      unsignedTxn: assetOptInTxn,
      needsUserSig: true,
    });
  }

  let unsignedTxns = [];
  for (let i = 0; i < outerTxns.length; i++) {
    unsignedTxns.push(outerTxns[i].unsignedTxn);
  }

  const noteMetadata = {
    algoBalance: makerAccountInfo.amount,
    asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
    assetId: assetId,
    n: n,
    d: d,
    escrowAddr: lsig.address(),
    orderEntry: generatedOrderEntry,
    escrowOrderType: 'buy',
    version: constants.ESCROW_CONTRACT_VERSION,
  };
    // look into accuracy of above object

  unsignedTxns = formatTransactionsWithMetadata(
      unsignedTxns,
      makerWalletAddr,
      noteMetadata,
      'open',
      'algo',
  );

  // TODO: Fixme!!
  if (signAndSend) {
    return await signAndSendTransactions(algodClient, outerTxns);
  }

  // TODO: Fixme!!
  if (!walletConnector || !walletConnector.connector.connected) {
    assignGroups(unsignedTxns);
  }

  return outerTxns;
}

/**
 * @deprecated
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
 * @return {Promise<undefined|Array>}
 */
async function executeMarketOrder(
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
  console.log('in Execute Market Order');

  return executeOrder(
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
  );
}

/**
 *
 * @param {*} algodClient
 * @param {*} makerWalletAddr
 * @param {*} n
 * @param {*} d
 * @param {*} min
 * @param {*} assetId
 * @param {*} assetAmount
 * @param {*} signAndSend
 * @param {*} walletConnector
 * @return {Promise<Object>}
 */
async function getPlaceASAToSellASAOrderIntoOrderbook(
    algodClient,
    makerWalletAddr,
    n,
    d,
    min,
    assetId,
    assetAmount,
    signAndSend,
    walletConnector,
) {
  console.debug('checking assetId type');
  assetId = parseInt(assetId + '');

  const outerTxns = [];

  const program = buildDelegateTemplateFromArgs(
      min,
      assetId,
      n,
      d,
      makerWalletAddr,
      true,
      constants.ESCROW_CONTRACT_VERSION,
  );

  const lsig = await getLsigFromProgramSource(
      algosdk,
      algodClient,
      program,
      constants.DEBUG_SMART_CONTRACT_SOURCE,
  );
  const generatedOrderEntry = generateOrder(
      makerWalletAddr,
      n,
      d,
      min,
      assetId,
  );
  console.debug('address is: ' + lsig.address());

  const makerAccountInfo = await getAccountInfo(makerWalletAddr);
  // check if the lsig has already opted in
  const accountInfo = await getAccountInfo(lsig.address());
  let alreadyOptedIn = false;
  if (accountInfo != null && accountInfo['apps-local-state'] != null &&
        accountInfo['apps-local-state'].length > 0 &&
        accountInfo['apps-local-state'][0].id === ASA_ESCROW_ORDER_BOOK_ID) {
    alreadyOptedIn = true;
  }
  console.debug('alreadyOptedIn: ' + alreadyOptedIn);
  console.debug('acct info:' + JSON.stringify(accountInfo));

  const params = await algodClient.getTransactionParams().do();
  console.debug('sending trans to: ' + lsig.address());

  const assetSendTrans = {
    ...params,
    fee: 1000,
    flatFee: true,
    type: 'axfer',
    assetIndex: assetId,
    from: makerWalletAddr,
    to: lsig.address(),
    amount: assetAmount,
  };
  const noteMetadata = {
    algoBalance: makerAccountInfo.amount,
    asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
    assetId: assetId,
    n: n,
    d: d,
    escrowAddr: accountInfo.address,
    orderEntry: generatedOrderEntry,
    escrowOrderType: 'sell',
    version: constants.ESCROW_CONTRACT_VERSION,
  };

  console.debug('herez88888 ', dumpVar(assetSendTrans));


  if (alreadyOptedIn) {
    outerTxns.push({
      unsignedTxn: assetSendTrans,
      needsUserSig: true,
    });

    // Below Conditional is neccessarry for when an order is already open and
    // the maker is just adding more asset value into it
    if (signAndSend) {
      let unsignedTxns = [];
      for (let i = 0; i < outerTxns.length; i++) {
        unsignedTxns.push(outerTxns[i].unsignedTxn);
      }
      unsignedTxns = formatTransactionsWithMetadata(
          unsignedTxns,
          makerWalletAddr,
          noteMetadata,
          'open',
          'asa',
      );
      return await signAndSendTransactions(algodClient, outerTxns);
    } else {
      return outerTxns;
    }
  }

  const payTxn = {
    ...params,
    type: 'pay',
    from: makerWalletAddr,
    to: lsig.address(),
    // fund with enough to subtract from later
    amount: constants.MIN_ASA_ESCROW_BALANCE,
  };
    // TODO: Fixme!
    // myAlgoWalletUtil.setTransactionFee(payTxn);

  console.debug('typeof: ' + typeof payTxn.txId);
  console.debug('the val: ' + payTxn.txId);

  // const payTxId = payTxn.txId;
  // console.debug("confirmed!!");
  // create unsigned transaction

  console.debug('here3 calling app from logic sig to open order');
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('open'));
  console.debug('before slice: ' + generatedOrderEntry);
  console.debug(generatedOrderEntry.slice(59));
  console.debug('after slice: ' + generatedOrderEntry.slice(59));

  appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
  appArgs.push(new Uint8Array([constants.ESCROW_CONTRACT_VERSION]));

  // add owners address as arg
  // ownersAddr = "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI";
  // ownersBitAddr = (algosdk.decodeAddress(ownersAddr)).publicKey;
  console.debug(appArgs.length);

  const logSigTrans = await createTransactionFromLogicSig(algodClient, lsig,
      ASA_ESCROW_ORDER_BOOK_ID, appArgs, 'appOptIn', params);

  // create optin transaction
  // sender and receiver are both the same
  const sender = lsig.address();
  const recipient = sender;
  // We set revocationTarget to undefined as
  // This is not a clawback operation
  const revocationTarget = undefined;
  // CloseReaminerTo is set to undefined as
  // we are not closing out an asset
  const closeRemainderTo = undefined;
  // We are sending 0 assets
  const amount = 0;

  // signing and sending "txn" allows sender to begin accepting
  // asset specified by creator and index
  const logSigAssetOptInTrans = algosdk.makeAssetTransferTxnWithSuggestedParams(
      sender,
      recipient,
      closeRemainderTo,
      revocationTarget,
      amount,
      undefined,
      assetId,
      params,
  );

  outerTxns.push({
    unsignedTxn: payTxn,
    needsUserSig: true,
  });
  outerTxns.push({
    unsignedTxn: logSigTrans,
    needsUserSig: false,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: logSigAssetOptInTrans,
    needsUserSig: false,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: assetSendTrans,
    needsUserSig: true,
  });

  let unsignedTxns = [];
  for (let i = 0; i < outerTxns.length; i++) {
    unsignedTxns.push(outerTxns[i].unsignedTxn);
  }
  // Check if just coincidence that asa balance in question is Always at the
  // top of the asset array, if it is then make function to filter relevant
  // balance via assetId
  // Also look into modifying internal methods to have more consistent naming
  // ex. (getAlgotoBuy and getAsaToSell would have same naming scheme of
  // makerAccountInfo and EscrowAccountInfo)

  unsignedTxns = formatTransactionsWithMetadata(
      unsignedTxns,
      makerWalletAddr,
      noteMetadata,
      'open',
      'asa',
  );
  if (signAndSend) {
    return await signAndSendTransactions(algodClient, outerTxns);
  }

  if (!walletConnector || !walletConnector.connector.connected) {
    assignGroups(unsignedTxns);
  }

  return outerTxns;
}

/**
 * @deprecated
 * @param {*} signedTxns
 */
function printTransactionDebug(signedTxns) {
  console.debug('zzTxnGroup to debug:');
  const b64_encoded = Buffer.concat(
      signedTxns.map((txn) => Buffer.from(txn)),
  ).toString('base64');

  console.debug(b64_encoded);
  if (
    constants.DEBUG_SMART_CONTRACT_SOURCE === 1 && constants.INFO_SERVER !== ''
  ) {
    (async () => {
      try {
        console.debug('trying to inspect');
        const response = await axios.post(
            constants.INFO_SERVER + '/inspect/unpack',
            {

              msgpack: b64_encoded,
              responseType: 'text/plain',
            },
        );
        console.debug(response.data);
        return response.data;
      } catch (error) {
        console.error('Could not print out transaction details: ' + error);
      }
    })();
  }
}


/**
 *
 * @param {*} client
 * @param {*} lsig
 * @param {*} AppID
 * @param {*} appArgs
 * @param {*} transType
 * @param {*} params
 * @return {Promise<null>}
 */
async function createTransactionFromLogicSig(client, lsig, AppID,
    appArgs, transType, params) {
  // define sender

  // TODO Fix useless catch
  try {
    const sender = lsig.address();

    // get node suggested parameters
    if (params == null) {
      params = await client.getTransactionParams().do();
    }

    // create unsigned transaction
    let txn = null;
    if (transType === 'appNoOp') {
      txn = algosdk.makeApplicationNoOpTxn(sender, params, AppID, appArgs);
    } else if (transType === 'appOptIn') {
      txn = algosdk.makeApplicationOptInTxn(
          lsig.address(),
          params,
          AppID,
          appArgs,
      );
    }

    return txn;
  } catch (e) {
    throw e;
  }
}

/**
 *
 * @param {*} makerWalletAddr
 * @param {*} N
 * @param {*} D
 * @param {*} min
 * @param {*} assetId
 * @param {*} includeMakerAddr
 * @return {string}
 */
function generateOrder(makerWalletAddr, N, D, min, assetId, includeMakerAddr = true) {
  let rtn = N + '-' + D + '-' + min + '-' + assetId;
  if (includeMakerAddr) {
    rtn = makerWalletAddr + '-' + rtn;
  }
  console.debug('generateOrder final str is: ' + rtn);
  return rtn;
}

/**
 *
 * @param {Object} x Object to Stringify
 * @return {string}
 */
function toString(x) {
  return JSON.stringify(x, null, 2);
}

/**
 *
 * @param {*} algodClient
 * @param {*} orderBookEscrowEntry
 * @param {*} takerCombOrderBalance
 * @param {*} params
 * @param {*} walletConnector
 * @return {Promise<*>}
 */
async function getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient, orderBookEscrowEntry,
    takerCombOrderBalance, params, walletConnector) {
  console.debug('looking at another orderbook entry to execute orderBookEscrowEntry: ' + toString(orderBookEscrowEntry));

  // rec contains the original order creators address
  const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
  const n = orderBookEscrowEntry['n'];
  const d = orderBookEscrowEntry['d'];
  const min = 0; // orders are set to 0 minimum for now
  const assetid = orderBookEscrowEntry['assetId'];

  const isASAEscrow = orderBookEscrowEntry['isASAEscrow'];

  const escrowSource = buildDelegateTemplateFromArgs(min, assetid, n, d, orderCreatorAddr, isASAEscrow, orderBookEscrowEntry['version']);
  const enableLsigLogging = constants.DEBUG_SMART_CONTRACT_SOURCE; // escrow logging
  const lsig = await getLsigFromProgramSource(algosdk, algodClient, escrowSource, enableLsigLogging);
  if (!isASAEscrow) {
    console.debug('NOT asa escrow');
    return await getExecuteAlgoOrderTxnsAsTaker(orderBookEscrowEntry, algodClient
        , lsig, takerCombOrderBalance, params, walletConnector);
  } else {
    console.debug('asa escrow');

    return await getExecuteASAOrderTxns(orderBookEscrowEntry, algodClient,
        lsig, takerCombOrderBalance, params, walletConnector);
  }
}

/**
 *
 * @param {*} orderBookEscrowEntry
 * @param {*} algodClient
 * @param {*} lsig
 * @param {*} takerCombOrderBalance
 * @param {*} params
 * @param {*} walletConnector
 * @return {Promise<*>}
 */
async function getExecuteASAOrderTxns(orderBookEscrowEntry, algodClient,
    lsig, takerCombOrderBalance, params, walletConnector) {
  console.debug('inside executeASAOrder!', toString(takerCombOrderBalance));
  console.debug('orderBookEscrowEntry ', toString(orderBookEscrowEntry));
  try {
    const retTxns = [];
    const appAccts = [];

    const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
    const orderBookEntry = orderBookEscrowEntry['orderEntry'];
    const appId = ASA_ESCROW_ORDER_BOOK_ID;
    const takerAddr = takerCombOrderBalance['takerAddr'];

    const assetId = orderBookEscrowEntry['assetId'];

    appAccts.push(orderCreatorAddr);
    appAccts.push(takerAddr);

    let closeRemainderTo = undefined;

    const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

    const {
      algoTradeAmount,
      escrowAsaTradeAmount,
      executionFees,
      closeoutFromASABalance: initialCloseoutFromASABalance,
    } = getExecuteASAOrderTakerTxnAmounts(
        takerCombOrderBalance,
        orderBookEscrowEntry,
    );

    if (algoTradeAmount === 0) {
      console.debug('nothing to do, returning early');
      return null;
    }

    let closeoutFromASABalance = initialCloseoutFromASABalance;
    console.debug('closeoutFromASABalance here111: ' + closeoutFromASABalance);
    if (orderBookEscrowEntry.useForceShouldCloseOrNot) {
      closeoutFromASABalance = orderBookEscrowEntry.forceShouldClose;
      console.debug('closeoutFromASABalance here222: ' + closeoutFromASABalance);
    }

    takerCombOrderBalance['algoBalance'] -= executionFees;
    takerCombOrderBalance['algoBalance'] -= algoTradeAmount;
    takerCombOrderBalance['walletAlgoBalance'] -= executionFees;
    takerCombOrderBalance['walletAlgoBalance'] -= algoTradeAmount;

    takerCombOrderBalance['asaBalance'] += escrowAsaTradeAmount;
    takerCombOrderBalance['walletASABalance'] += escrowAsaTradeAmount;
    console.debug('ASA here110 algoAmount asaAmount txnFee takerOrderBalance: ', algoTradeAmount,
        escrowAsaTradeAmount, executionFees, toString(takerCombOrderBalance));

    console.debug('receiving ASA ' + escrowAsaTradeAmount + ' from  ' + lsig.address());
    console.debug('sending ALGO amount ' + algoTradeAmount + ' to ' + orderCreatorAddr);

    if (closeoutFromASABalance === true) {
      // only closeout if there are no more ASA in the account
      console.debug('closeoutFromASABalance here333: ' + closeoutFromASABalance);
      closeRemainderTo = orderCreatorAddr;
    }
    let transaction1 = null;
    let appCallType = null;

    if (isUndefined(closeRemainderTo)) {
      appCallType = 'execute';
    } else {
      appCallType = 'execute_with_closeout';
    }

    const appArgs = [];
    const enc = new TextEncoder();
    appArgs.push(enc.encode(appCallType));
    appArgs.push(enc.encode(orderBookEntry));

    if (orderBookEscrowEntry.txnNum != null) {
      // uniquify this transaction even if this arg isn't used
      appArgs.push(enc.encode(orderBookEscrowEntry.txnNum));
    }

    // appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);
    // appArgs.push(enc.encode(assetId));

    console.debug(appArgs.length);


    if (isUndefined(closeRemainderTo)) {
      transaction1 = algosdk.makeApplicationNoOpTxn(
          lsig.address(),
          params,
          appId,
          appArgs,
          appAccts,
          [0],
          [assetId],
      );
    } else {
      transaction1 = algosdk.makeApplicationCloseOutTxn(
          lsig.address(),
          params,
          appId,
          appArgs,
          appAccts,
          [0],
          [assetId],
      );
    }


    console.debug('app call type is: ' + appCallType);

    const fixedTxn2 = {
      type: 'pay',
      from: takerAddr,
      to: orderCreatorAddr,
      amount: algoTradeAmount,
      ...params,
    };
    // ***
    const takerAlreadyOptedIntoASA = takerCombOrderBalance.takerIsOptedIn;
    console.debug({takerAlreadyOptedIntoASA});

    // asset opt-in transfer
    let transaction2b = null;

    if (!takerAlreadyOptedIntoASA) {
      transaction2b = {
        type: 'axfer',
        from: takerAddr,
        to: takerAddr,
        amount: 0,
        assetIndex: assetId,
        ...params,
      };
    }

    // Make asset xfer

    // Asset transfer from escrow account to order executor
    const transaction3 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        lsig.address(),
        takerAddr,
        closeRemainderTo,
        undefined,
        escrowAsaTradeAmount,
        undefined,
        assetId,
        params,
    );


    let transaction4 = null;
    if (!isUndefined(closeRemainderTo)) {
      // Make payment tx signed with lsig back to owner creator
      console.debug('making transaction4 due to closeRemainderTo');
      transaction4 = algosdk.makePaymentTxnWithSuggestedParams(
          lsig.address(),
          orderCreatorAddr,
          0,
          orderCreatorAddr,
          undefined,
          params,
      );
    } else {
      // Make fee refund transaction
      transaction4 = {
        type: 'pay',
        from: takerAddr,
        to: lsig.address(),
        amount: refundFees,
        ...params,
      };
    }

    // TODO: Fixme!
    // myAlgoWalletUtil.setTransactionFee(fixedTxn2);
    //
    // if (transaction2b != null) {
    //     myAlgoWalletUtil.setTransactionFee(transaction2b);
    // }


    let txns = [];
    txns.push(transaction1);
    txns.push(fixedTxn2);
    if (transaction2b != null) {
      console.debug('adding transaction2b due to asset not being opted in');
      txns.push(transaction2b);
    } else {
      console.debug('NOT adding transaction2b because already opted');
    }
    txns.push(transaction3);
    txns.push(transaction4);

    if (!isUndefined(closeRemainderTo)) {
      txns = formatTransactionsWithMetadata(
          txns,
          takerAddr,
          orderBookEscrowEntry,
          'execute_full',
          'asa',
      );
    } else {
      txns = formatTransactionsWithMetadata(
          txns,
          takerAddr,
          orderBookEscrowEntry,
          'execute_partial',
          'asa',
      );
    }


    // it goes by reference so modifying array affects individual objects and vice versa

    if (!!walletConnector && walletConnector.connector.connected) {
      retTxns.push({
        'unsignedTxn': transaction1,
        'lsig': lsig,
      });
      retTxns.push({
        'unsignedTxn': fixedTxn2,
        'needsUserSig': true,
        'amount': fixedTxn2.amount,
        'txType': 'algo',
      });

      if (transaction2b != null) {
        retTxns.push({
          'unsignedTxn': transaction2b,
          'needsUserSig': true,
        });
      }
      retTxns.push({
        'unsignedTxn': transaction3,
        'amount': escrowAsaTradeAmount,
        'txType': 'asa',
        'lsig': lsig,
      });

      if (!isUndefined(closeRemainderTo)) {
        retTxns.push({
          'unsignedTxn': transaction4,
          'lsig': lsig,
        });
      } else {
        retTxns.push({
          'unsignedTxn': transaction4,
          'needsUserSig': true,
        });
      }

      return retTxns;
    }


    const groupID = algosdk.computeGroupID(txns);
    for (let i = 0; i < txns.length; i++) {
      txns[i].group = groupID;
    }

    const signedTx1 = algosdk.signLogicSigTransactionObject(transaction1, lsig);
    // let signedTx2 = await myAlgoWallet.signTransaction(fixedTxn2);
    const signedTx3 = algosdk.signLogicSigTransactionObject(transaction3, lsig);
    let signedTx4 = null;
    if (!isUndefined(closeRemainderTo)) {
      signedTx4 = algosdk.signLogicSigTransactionObject(transaction4, lsig);
    }

    retTxns.push({
      'signedTxn': signedTx1.blob,
    });
    retTxns.push({
      'unsignedTxn': fixedTxn2,
      'needsUserSig': true,
      'amount': fixedTxn2.amount,
      'txType': 'algo',
    });

    if (transaction2b != null) {
      retTxns.push({
        'unsignedTxn': transaction2b,
        'needsUserSig': true,
      });
    }
    retTxns.push({
      'signedTxn': signedTx3.blob,
      'amount': escrowAsaTradeAmount,
      'txType': 'asa',
    });

    if (signedTx4 != null) {
      retTxns.push({
        'signedTxn': signedTx4.blob,
      });
    } else {
      retTxns.push({
        'unsignedTxn': transaction4,
        'needsUserSig': true,
      });
    }

    return retTxns;
  } catch (e) {
    console.debug(e);
    if (!isUndefined(e.text)) {
      alert(e.text);
    } else {
      alert(e);
    }
  }
}

/**
 *
 * @param {*} orderBookEscrowEntry
 * @param {Algodv2} algodClient
 * @param {*} lsig
 * @param {*} takerCombOrderBalance
 * @param {Object} params
 * @param {*} walletConnector
 * @return {Promise<*>}
 */
async function getExecuteAlgoOrderTxnsAsTaker(
    orderBookEscrowEntry,
    algodClient,
    lsig,
    takerCombOrderBalance,
    params,
    walletConnector,
) {
  try {
    console.debug('in getExecuteAlgoOrderTxnsAsTaker');
    console.debug('orderBookEscrowEntry, algodClient, takerCombOrderBalance',
        toString(orderBookEscrowEntry), algodClient,
        takerCombOrderBalance);

    const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
    const orderBookEntry = orderBookEscrowEntry['orderEntry'];
    const appId = ALGO_ESCROW_ORDER_BOOK_ID;
    const currentEscrowAlgoBalance = orderBookEscrowEntry['algoBalance'];
    const assetId = orderBookEscrowEntry['assetId'];
    const takerAddr = takerCombOrderBalance['takerAddr'];

    console.debug('assetid: ' + assetId);

    const retTxns = [];
    const appArgs = [];
    const enc = new TextEncoder();

    const appAccts = [];
    appAccts.push(orderCreatorAddr);
    appAccts.push(takerAddr);
    // Call stateful contract

    let closeRemainderTo = undefined;
    const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

    const {algoAmountReceiving, asaAmountSending, txnFee} =
            getExecuteAlgoOrderTakerTxnAmounts(orderBookEscrowEntry, takerCombOrderBalance);

    if (algoAmountReceiving === 0) {
      console.debug('algoAmountReceiving is 0, nothing to do, returning early');
      return null;
    }

    takerCombOrderBalance['algoBalance'] -= txnFee;
    takerCombOrderBalance['algoBalance'] += algoAmountReceiving;
    takerCombOrderBalance['asaBalance'] -= asaAmountSending;
    console.debug('here11 algoAmount asaAmount txnFee takerOrderBalance: ', algoAmountReceiving,
        asaAmountSending, txnFee, toString(takerCombOrderBalance));

    console.debug('receiving ' + algoAmountReceiving + ' from  ' + lsig.address());
    console.debug('sending ASA amount ' + asaAmountSending + ' to ' + orderCreatorAddr);
    if (currentEscrowAlgoBalance - algoAmountReceiving < constants.MIN_ESCROW_BALANCE) {
      closeRemainderTo = orderCreatorAddr;
    }
    if (orderBookEscrowEntry.useForceShouldCloseOrNot) {
      if (orderBookEscrowEntry.forceShouldClose === true) {
        closeRemainderTo = orderCreatorAddr;
      } else {
        closeRemainderTo = undefined;
      }
    }
    let appCallType = null;
    if (closeRemainderTo == undefined) {
      appCallType = 'execute';
    } else {
      appCallType = 'execute_with_closeout';
    }
    console.debug('arg1: ' + appCallType);
    console.debug('arg2: ' + orderBookEntry);

    appArgs.push(enc.encode(appCallType));
    appArgs.push(enc.encode(orderBookEntry));
    if (orderBookEscrowEntry.txnNum != null) {
      // uniquify this transaction even if this arg isn't used
      appArgs.push(enc.encode(orderBookEscrowEntry.txnNum));
    }
    // appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);
    console.debug(appArgs.length);

    let transaction1 = null;

    if (closeRemainderTo === undefined) {
      transaction1 = algosdk.makeApplicationNoOpTxn(
          lsig.address(),
          params, appId,
          appArgs,
          appAccts,
      );
    } else {
      transaction1 = algosdk.makeApplicationCloseOutTxn(
          lsig.address(),
          params,
          appId,
          appArgs,
          appAccts,
      );
    }

    // Make payment tx signed with lsig
    const transaction2 = algosdk.makePaymentTxnWithSuggestedParams(
        lsig.address(),
        takerAddr,
        algoAmountReceiving,
        closeRemainderTo,
        undefined,
        params,
    );
    // Make asset xfer

    const transaction3 = {
      type: 'axfer',
      from: takerAddr,
      to: orderCreatorAddr,
      amount: asaAmountSending,
      assetIndex: assetId,
      ...params,
    };

    let transaction4 = null;

    if (closeRemainderTo === undefined) {
      // create refund transaction for fees
      transaction4 = {
        type: 'pay',
        from: takerAddr,
        to: lsig.address(),
        amount: refundFees,
        ...params,
      };
    }

    //  delete fixedTxn1.note;
    delete transaction3.note;
    // delete fixedTxn1.lease;
    delete transaction3.lease;
    delete transaction3.appArgs;

    // TODO: Fixme!
    // myAlgoWalletUtil.setTransactionFee(fixedTxn1);
    // myAlgoWalletUtil.setTransactionFee(transaction3);

    let txns = [transaction1, transaction2, transaction3];
    if (transaction4 != null) {
      txns.push(transaction4);
    }

    if (closeRemainderTo === undefined) {
      txns = formatTransactionsWithMetadata(
          txns,
          takerAddr,
          orderBookEscrowEntry,
          'execute_partial',
          'algo',
      );
    } else {
      txns = formatTransactionsWithMetadata(
          txns,
          takerAddr,
          orderBookEscrowEntry,
          'execute_full',
          'algo',
      );
    }

    // algosdk.assignGroupID(txns);

    if (!!walletConnector && walletConnector.connector.connected) {
      retTxns.push({
        'unsignedTxn': transaction1,
        'lsig': lsig,
      });
      retTxns.push({
        'unsignedTxn': transaction2,
        'amount': transaction2.amount,
        'lsig': lsig,
        'txType': 'algo',
      });


      retTxns.push({
        'unsignedTxn': transaction3,
        'needsUserSig': true,
        'amount': transaction3.amount,
        'txType': 'asa',
        'lsig': lsig,
      });

      if (transaction4) {
        retTxns.push({
          'unsignedTxn': transaction4,
          'needsUserSig': true,
        });
      }


      return retTxns;
    }
    // have it return retTxns here to avoid signing of Lsigs

    const groupID = algosdk.computeGroupID(txns);
    for (let i = 0; i < txns.length; i++) {
      txns[i].group = groupID;
    }

    const signedTx1 = algosdk.signLogicSigTransactionObject(txns[0], lsig);
    const signedTx2 = algosdk.signLogicSigTransactionObject(txns[1], lsig);

    retTxns.push({
      'signedTxn': signedTx1.blob,
    });
    retTxns.push({
      'signedTxn': signedTx2.blob,
      'amount': transaction2.amount,
      'txType': 'algo',

    });
    retTxns.push({
      'unsignedTxn': transaction3,
      'needsUserSig': true,
      'txType': 'asa',
      'amount': transaction3.amount,

    });

    if (transaction4 != null) {
      retTxns.push({
        'unsignedTxn': transaction4,
        'needsUserSig': true,
      });
    }

    return retTxns;
  } catch (e) {
    console.debug(e);
    if (!isUndefined(e.text)) {
      alert(e.text);
    } else {
      alert(e);
    }
  }
}

/**
 *
 * @param {string} takerWalletAddr
 * @param {boolean} isSellingAssetAsTakerOrder
 * @param {*} allOrderBookOrders
 * @return {Array}
 */
function getQueuedTakerOrders(
    takerWalletAddr,
    isSellingAssetAsTakerOrder,
    allOrderBookOrders,
) {
  console.debug(`getQueuedTakerOrders(${isSellingAssetAsTakerOrder})`);

  const queuedOrders = [];
  // getAllOrderBookEscrowOrders is UI dependant and needs to be customized for the React version

  if (allOrderBookOrders == null || allOrderBookOrders.length === 0) {
    return;
  }

  // FIXME: don't allow executions against own orders! check wallet address doesn't match
  // takerWalletAddr

  for (let i = 0; i < allOrderBookOrders.length; i++) {
    const orderBookEntry = allOrderBookOrders[i];

    if (orderBookEntry['escrowOrderType'] === 'buy' && !isSellingAssetAsTakerOrder) {
      // only look for sell orders in this case
      continue;
    }
    if (orderBookEntry['escrowOrderType'] === 'sell' && isSellingAssetAsTakerOrder) {
      // only look for buy orders in this case
      continue;
    }
    orderBookEntry.price = parseFloat(orderBookEntry.price);

    queuedOrders.push(orderBookEntry);
  }

  if (isSellingAssetAsTakerOrder) {
    // sort highest first (index 0) to lowest (last index)
    // these are buy orders, so we want to sell to the highest first
    queuedOrders.sort((a, b) => (a.price < b.price) ? 1 : (a.price === b.price) ? ((a.price < b.price) ? 1 : -1) : -1);
  } else {
    // sort lowest first (index 0) to highest (last index)
    // these are sell orders, so we want to buy the lowest first
    queuedOrders.sort((a, b) => (a.price > b.price) ? 1 : (a.price === b.price) ? ((a.price > b.price) ? 1 : -1) : -1);
  }

  return queuedOrders;
}

/**
 *
 * @param {Algodv2} algodClient
 * @param {*} escrowAddr
 * @param {*} creatorAddr
 * @param {*} index
 * @param {*} appArgs
 * @param {*} lsig
 * @param {*} assetId
 * @param {*} metadata
 * @param {*} walletConnector
 * @return {Promise<Object>}
 */
async function closeASAOrder(algodClient, escrowAddr, creatorAddr, index, appArgs, lsig, assetId, metadata, walletConnector) {
  console.debug('closing asa order!!!');

  try {
    // get node suggested parameters
    const params = await algodClient.getTransactionParams().do();

    // create unsigned transaction
    const txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, index, appArgs);
    let txId = txn.txID().toString();
    // Submit the transaction

    // create optin transaction
    // sender and receiver are both the same
    const sender = lsig.address();
    const recipient = creatorAddr;
    // We set revocationTarget to undefined as
    // This is not a clawback operation
    const revocationTarget = undefined;
    // CloseReaminerTo is set to undefined as
    // we are not closing out an asset
    const closeRemainderTo = creatorAddr;
    // We are sending 0 assets
    const amount = 0;

    // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
    const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, revocationTarget,
        amount, undefined, assetId, params);

    // Make payment tx signed with lsig
    const txn3 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), creatorAddr, 0, creatorAddr,
        undefined, params);

    const txn4 = {
      type: 'pay',
      from: creatorAddr,
      to: creatorAddr,
      amount: 0,
      ...params,
    };

    let txns = [txn, txn2, txn3, txn4];


    const makerAccountInfo = await getAccountInfo(creatorAddr);
    const escrowAccountInfo = await getAccountInfo(escrowAddr);

    const noteMetadata = {
      algoBalance: makerAccountInfo.amount,
      asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
      assetId: assetId,
      n: metadata.n,
      d: metadata.d,
      orderEntry: metadata.orderBookEntry,
      version: metadata.version,
      escrowAddr: escrowAccountInfo.address,
      escrowOrderType: 'close',
      txType: 'close',
      isASAescrow: true,
    };

    txns = formatTransactionsWithMetadata(txns, creatorAddr, noteMetadata, 'close', 'asa');

    if (!!walletConnector && walletConnector.connector.connected) {
      const retTxns = [];
      retTxns.push({
        'unsignedTxn': txn,
        'lsig': lsig,
      });
      retTxns.push({
        'unsignedTxn': txn2,
        'lsig': lsig,
      });


      retTxns.push({
        'unsignedTxn': txn3,
        'lsig': lsig,
      });

      retTxns.push({
        'unsignedTxn': txn4,
        'needsUserSig': true,
      });

      const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, retTxns, params, walletConnector);
      return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
    }

    const groupID = algosdk.computeGroupID(txns);
    for (let i = 0; i < txns.length; i++) {
      txns[i].group = groupID;
    }


    const signedTx = algosdk.signLogicSigTransactionObject(txn, lsig);
    txId = signedTx.txID;
    // console.debug("signedTxn:" + JSON.stringify(signedTx));
    console.debug('Signed transaction with txID: %s', txId);

    const signedTx2 = algosdk.signLogicSigTransactionObject(txn2, lsig);
    const txId2 = signedTx2.txID;
    // console.debug("signedTxn:" + JSON.stringify(signedTx));
    console.debug('Signed transaction with txID: %s', txId2);

    const signedTx3 = algosdk.signLogicSigTransactionObject(txn3, lsig);
    const txId3 = signedTx3.txID;
    // console.debug("signedTxn:" + JSON.stringify(signedTx));
    console.debug('Signed transaction3 with txID: %s', txId3);
    const connector = require('../wallet/connectors/MyAlgoConnect');
    const signedTx4 = await connector.signTransaction(txn4);
    console.debug('zzsigned txn: ' + signedTx4.txID);

    const signed = [];
    signed.push(signedTx.blob);
    signed.push(signedTx2.blob);
    signed.push(signedTx3.blob);
    signed.push(signedTx4.blob);
    printTransactionDebug(signed);

    // console.debug(Buffer.concat(signed.map(txn => Buffer.from(txn))).toString('base64'));
    const tx = await algodClient.sendRawTransaction(signed).do();
    console.debug(tx.txId);

    const confirmation = await waitForConfirmation(tx.txId);
    // display results
    console.debug({confirmation});
    return confirmation;
  } catch (e) {
    throw e;
  }
}


/**
 *
 * @TODO: Refactor to use algosdk.Indexer or move to lib/http
 * @param {*} accountAddr
 * @param {*} returnEmptyAccount
 * @return {Promise<Object>}
 */
async function getAccountInfo(accountAddr, returnEmptyAccount = true) {
  const getEmptyAccountInfo = (address) => {
    return {
      'address': address,
      'amount': 0, 'amount-without-pending-rewards': 0, 'apps-local-state': [],
      'apps-total-schema': {'num-byte-slice': 0, 'num-uint': 0}, 'assets': [],
      'created-apps': [], 'created-assets': [], 'pending-rewards': 0,
      'reward-base': 0, 'rewards': 0, 'round': -1, 'status': 'Offline',
    };
  };
  const port = (ALGOD_INDEXER_PORT) ? ':' + ALGOD_INDEXER_PORT : '';

  try {
    const response = await axios.get(ALGOD_INDEXER_SERVER + port +
            '/v2/accounts/' + accountAddr, {headers: {'X-Algo-API-Token': ALGOD_INDEXER_TOKEN}});
    if (response.data && response.data.account) {
      return response.data.account;
    } else if (returnEmptyAccount) {
      return getEmptyAccountInfo(accountAddr);
    } else {
      return null;
    }
  } catch (e) {
    if (returnEmptyAccount) {
      return getEmptyAccountInfo(accountAddr);
    }
    return null;
  }
}

/**
 *
 * @param {Algodv2} algodClient
 * @param {string} escrowAddr
 * @param {string} creatorAddr
 * @param {number} appIndex
 * @param {Object} appArgs
 * @param {Object} lsig
 * @param {Object} metadata
 * @param {Object} walletConnector
 * @return {Promise<Object>}
 */
async function closeOrder(
    algodClient,
    escrowAddr,
    creatorAddr,
    appIndex,
    appArgs,
    lsig,
    metadata,
    walletConnector,
) {
  const accountInfo = await getAccountInfo(lsig.address());
  // const alreadyOptedIn = false;
  if (accountInfo != null && accountInfo['assets'] != null &&
        accountInfo['assets'].length > 0 && accountInfo['assets'][0] != null) {
    await closeASAOrder(
        algodClient,
        escrowAddr,
        creatorAddr,
        appIndex,
        appArgs,
        lsig,
    );
    return;
  }
  // TODO: Remove useless Try/Catch
  try {
    // get node suggested parameters
    const params = await algodClient.getTransactionParams().do();

    // create unsigned transaction
    const txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, appIndex, appArgs);
    let txId = txn.txID().toString();
    // Submit the transaction

    // Make payment tx signed with lsig
    const txn2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), creatorAddr, 0, creatorAddr, undefined, params);

    const txn3 = {
      type: 'pay',
      from: creatorAddr,
      to: creatorAddr,
      amount: 0,
      ...params,
    };

    // TODO: Fixme!
    // myAlgoWalletUtil.setTransactionFee(txn3);

    let txns = [txn, txn2, txn3];
    const makerAccountInfo = await getAccountInfo(creatorAddr);
    const escrowAccountInfo = await getAccountInfo(escrowAddr);

    const noteMetadata = {
      algoBalance: makerAccountInfo.amount,
      asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
      n: metadata.n,
      d: metadata.d,
      orderEntry: metadata.orderBookEntry,
      assetId: 0,
      version: metadata.version,
      escrowAddr: escrowAccountInfo.address,
      escrowOrderType: 'close',
      txType: 'close',
      isASAescrow: true,
    };

    txns = formatTransactionsWithMetadata(txns, creatorAddr, noteMetadata, 'close', 'algo');

    if (!!walletConnector && walletConnector.connector.connected) {
      const retTxns = [];
      retTxns.push({
        'unsignedTxn': txn,
        'lsig': lsig,
      });
      retTxns.push({
        'unsignedTxn': txn2,
        'lsig': lsig,
      });

      retTxns.push({
        'unsignedTxn': txn3,
        'needsUserSig': true,
      });

      const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, retTxns, params, walletConnector);

      return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
    }
    const groupID = algosdk.computeGroupID(txns);
    for (let i = 0; i < txns.length; i++) {
      txns[i].group = groupID;
    }

    const signedTx = algosdk.signLogicSigTransactionObject(txn, lsig);
    txId = signedTx.txID;
    // console.debug("signedTxn:" + JSON.stringify(signedTx));
    console.debug('Signed transaction with txID: %s', txId);

    const signedTx2 = algosdk.signLogicSigTransactionObject(txn2, lsig);
    const txId2 = signedTx2.txID;
    // console.debug("signedTxn:" + JSON.stringify(signedTx));
    console.debug('Signed transaction with txID: %s', txId2);
    const connector = require('../wallet/connectors/MyAlgoConnect');
    const signedTx3 = await connector.signTransaction(txn3);
    console.debug('zzsigned txn: ' + signedTx3.txID);

    const signed = [];
    signed.push(signedTx.blob);
    signed.push(signedTx2.blob);
    signed.push(signedTx3.blob);

    printTransactionDebug(signed);

    // console.debug(Buffer.concat(signed.map(txn => Buffer.from(txn))).toString('base64'));
    const tx = await algodClient.sendRawTransaction(signed).do();
    const confirmation = await waitForConfirmation(tx.txId);
    // display results
    console.debug({confirmation});
    return confirmation;
  } catch (e) {
    throw e;
  }
}

/**
 *
 * @param {*} min
 * @param {*} assetid
 * @param {*} N
 * @param {*} D
 * @param {*} writerAddr
 * @param {*} isASAEscrow
 * @param {*} version
 * @return {string|null}
 */
function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version = 3) {
  let orderBookId = null;
  if (isASAEscrow) {
    orderBookId = ASA_ESCROW_ORDER_BOOK_ID;
  } else {
    orderBookId = ALGO_ESCROW_ORDER_BOOK_ID;
  }

  // This is only used for test cases to override the app IDs. Possibly refactor.
  if (isASAEscrow && global.ASA_ESCROW_APP_ID != undefined) {
    orderBookId = global.ASA_ESCROW_APP_ID;
  } else if (!isASAEscrow && global.ALGO_ESCROW_APP_ID != undefined) {
    orderBookId = global.ALGO_ESCROW_APP_ID;
  }

  if (isNaN(min) || isNaN(assetid) || isNaN(N) || isNaN(D) || isNaN(orderBookId)) {
    throw new Error('one or more null arguments in buildDelegateTemplateFromArgs!');
  }
  console.debug('here913 in buildDelegateTemplateFromArgs. min, assetid, N, D, writerAddr, isASAEscrow, orderbookId, version',
      min, assetid, N, D, writerAddr, isASAEscrow, orderBookId, version);
  let delegateTemplate = null;
  if (!isASAEscrow) {
    if (version === 7) {
      console.debug('not isASAEscrow, using version 7');
      delegateTemplate = algoDelegateTemplateV7;
    } else if (version === 6) {
      console.debug('not isASAEscrow, using version 6');
      delegateTemplate = algoDelegateTemplateV6;
    } else if (version === 5) {
      console.debug('not isASAEscrow, using version 5');
      delegateTemplate = algoDelegateTemplateV5;
    } else if (version === 4) {
      console.debug('not isASAEscrow, using version 4');
      delegateTemplate = algoDelegateTemplateV4;
    } else {
      console.debug('not isASAEscrow, using version 3');
      delegateTemplate = algoDelegateTemplate;
    }
  } else {
    if (version === 7) {
      // This should ideally use version 7 contracts, but due to a prior
      // software error, version 7 contracts were incorrectly using version 3.
      // We need to maintain that now for consistency between the client and
      // server node.js process.
      console.debug('isASAEscrow, using version 7 (with v3 template)');
      delegateTemplate = asaDelegateTemplate;
    } else if (version === 6) {
      console.debug('isASAEscrow, using version 6');
      delegateTemplate = asaDelegateTemplateV6;
    } else if (version === 5) {
      console.debug('isASAEscrow, using version 5');
      delegateTemplate = asaDelegateTemplateV5;
    } else if (version === 4) {
      console.debug('isASAEscrow, using version 4');
      delegateTemplate = asaDelegateTemplateV4;
    } else {
      console.debug('isASAEscrow, using version 3');
      delegateTemplate = asaDelegateTemplate;
    }
  }
  console.debug('min is: ' + min);
  let res = delegateTemplate.split('<min>').join(min);
  res = res.split('<assetid>').join(assetid);
  res = res.split('<N>').join(N);
  res = res.split('<D>').join(D);
  res = res.split('<contractWriterAddr>').join(writerAddr);
  res = res.split('<orderBookId>').join(orderBookId);

  // console.debug(res);
  return res;
}

/**
 *
 * @param {*} algosdk
 * @param {*} algodClient
 * @param {*} program
 * @param {*} logProgramSource
 * @return {Promise<*>}
 */
async function getLsigFromProgramSource(
    algosdk,
    algodClient,
    program,
    logProgramSource,
) {
  if (logProgramSource) {
    console.debug('logging source!!');
    console.debug(program);
  }

  // Simple but effective hash function
  // https://stackoverflow.com/a/52171480
  const cyrb53 = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed; let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  };

  const hashedProgram = cyrb53(program);
  console.debug('hashed program: ' + hashedProgram);
  let compilationResult = null;
  let compilation;
  if (hashedProgram in compilationResults) {
    compilationResult = compilationResults[hashedProgram];
    console.debug('got compilation results from hash! ' + hashedProgram);
  } else {
    console.debug('program not found in cache, fetching');
    compilation = await compileProgram(algodClient, program);
    compilationResult = compilation.result;
    if (Object.keys(compilationResults).length > 200) {
      console.debug('size is too large! resetting keys');
      compilationResults = {};
    }
    compilationResults[hashedProgram] = compilationResult;
  }

  const uintAr = _base64ToArrayBuffer(compilationResult);
  const args = undefined;
  const lsig = algosdk.makeLogicSig(uintAr, args);
  console.debug('lsig addr: ' + lsig.address());
  return lsig;
}

/**
 * @deprecated
 * @todo import from '../teal/Transactions'
 * @param {Algodv2} client
 * @param {*} programSource
 * @return {Promise<*>}
 */
async function compileProgram(client, programSource) {
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(programSource);
  return await client.compile(programBytes).do();
}

/**
 *
 * @param b64
 * @return {Buffer}
 * @private
 */
function _base64ToArrayBuffer(b64) {
  return Buffer.from(b64, 'base64');
  /* var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;*/
}

/**
 * @todo move to ../Errors
 * @param message
 * @constructor
 */
function OrderTypeException(message) {
  this.message = message;
  this.name = 'OrderTypeException';
}

OrderTypeException.prototype = Error.prototype;

/**
 *
 * @param {*} txns
 * @param {*} takerAddr
 * @param {*} orderBookEscrowEntry
 * @param {*} orderType
 * @param {*} currency
 * @return {*}
 */
function formatTransactionsWithMetadata(
    txns,
    takerAddr,
    orderBookEscrowEntry,
    orderType,
    currency,
) {
  const acceptedOrderTypes = ['open', 'execute_full', 'execute_partial', 'close'];
  const acceptedCurrency = ['algo', 'asa'];
  if (!acceptedOrderTypes.includes(orderType)) {
    throw new OrderTypeException(`Invalid order type, please input one of the following: ${acceptedOrderTypes}`);
  }
  if (!acceptedCurrency.includes(currency)) {
    throw new OrderTypeException(`Invalid currency type, please input one of the following: ${acceptedCurrency}`);
  }
  const enc = new TextEncoder();
  const groupMetadata = {};
  groupMetadata[`${takerAddr}-${orderBookEscrowEntry.assetId}-[${orderType}]_[${currency}] `] = orderBookEscrowEntry;
  return txns.map((txn) => {
    txn.note = enc.encode(JSON.stringify(groupMetadata));
    return txn;
  });
}

/**
 *
 * @param {*} takerCombOrderBalance
 * @param {*} orderBookEscrowEntry
 * @return {Object}
 */
function getExecuteASAOrderTakerTxnAmounts(
    takerCombOrderBalance,
    orderBookEscrowEntry,
) {
  console.debug('printing!!!');
  console.debug({takerCombOrderBalance, orderBookEscrowEntry});

  const orderBookEntry = orderBookEscrowEntry['orderEntry'];
  const min_asa_balance = 0;

  // 1000000-250000-0-15322902
  // n-d-minOrderSize-assetId
  const orderBookEntrySplit = orderBookEntry.split('-');
  const n = orderBookEntrySplit[0];
  const d = orderBookEntrySplit[1];

  let escrowAsaTradeAmount = orderBookEscrowEntry['asaBalance'];
  const currentEscrowASABalance = orderBookEscrowEntry['asaBalance'];
  const price = new BigN(d).divide(new BigN(n), 30);
  const bDecOne = new BigN(1);
  const executionFees = 0.004 * 1000000;
  let closeoutFromASABalance = true;
  escrowAsaTradeAmount = new BigN(escrowAsaTradeAmount);
  let algoTradeAmount = price.multiply(escrowAsaTradeAmount);
  if (algoTradeAmount.getValue().includes('.')) {
    algoTradeAmount = algoTradeAmount.floor().add(bDecOne); // round up to give seller more money
  }
  // FIXME - check if lower than order balance
  const maxTradeAmount = Math.min(takerCombOrderBalance['algoBalance'], takerCombOrderBalance['walletAlgoBalance'] - executionFees);
  const emptyReturnVal = {
    'algoTradeAmount': 0,
    'escrowAsaTradeAmount': 0,
    'executionFees': 0,
    'closeoutFromASABalance': false,
  };

  if (algoTradeAmount.compareTo(new BigN(maxTradeAmount)) == GREATER_THAN &&
        algoTradeAmount.compareTo(bDecOne) == GREATER_THAN &&
        algoTradeAmount.subtract(new BigN(maxTradeAmount)).compareTo(bDecOne) == GREATER_THAN) {
    console.debug('here999a reducing algoTradeAmount, currently at: ' + algoTradeAmount.getValue());
    algoTradeAmount = new BigN(maxTradeAmount);
    escrowAsaTradeAmount = algoTradeAmount.divide(price, 30);
    console.debug('checking max: ' + escrowAsaTradeAmount.getValue() + ' ' + 1);
    if (escrowAsaTradeAmount.compareTo(bDecOne) == LESS_THAN) { // don't allow 0 value
      escrowAsaTradeAmount = bDecOne;
    }
    console.debug('here999b reduced to algoTradeAmount escrowAsaAmount', algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());

    if (escrowAsaTradeAmount.getValue().includes('.')) {
      // round ASA amount
      escrowAsaTradeAmount = escrowAsaTradeAmount.floor();
      algoTradeAmount = price.multiply(escrowAsaTradeAmount);
      if (algoTradeAmount.getValue().includes('.')) {
        algoTradeAmount = algoTradeAmount.floor().add(bDecOne); // round up to give seller more money
        console.debug('here999bc increased algo to algoTradeAmount escrowAsaAmount', algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
      }
      console.debug('here999c changed to algoTradeAmount escrowAsaAmount', algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
    }
  } // FIXME: factor in fees?

  if (new BigN(currentEscrowASABalance).subtract(escrowAsaTradeAmount)
      .compareTo(new BigN(min_asa_balance)) == GREATER_THAN) {
    console.debug('asa escrow here9992 (currentASABalance - escrowAsaAmount) > min_asa_balance',
        currentEscrowASABalance, escrowAsaTradeAmount.getValue(), min_asa_balance);
    closeoutFromASABalance = false;
  }

  if (takerCombOrderBalance['walletAlgoBalance'] < executionFees + parseInt(algoTradeAmount.getValue())) {
    console.debug('here9992b algo balance too low, returning early! ', executionFees, algoTradeAmount.getValue(), takerCombOrderBalance);
    return emptyReturnVal; // no balance left to use for buying ASAs
  }

  escrowAsaTradeAmount = parseInt(escrowAsaTradeAmount.getValue());
  algoTradeAmount = parseInt(algoTradeAmount.getValue());

  if (escrowAsaTradeAmount <= 0) {
    console.debug('here77zz escrowAsaTradeAmount is at 0 or below. returning early! nothing to do');
    return emptyReturnVal;
  }
  if (algoTradeAmount <= 0) {
    console.debug('here77zb algoTradeAmount is at 0 or below. returning early! nothing to do');
    return emptyReturnVal;
  }

  // FIXME - need more logic to transact correct price in case balances dont match order balances
  console.debug('closeoutFromASABalance: ' + closeoutFromASABalance);

  console.debug('almost final amounts algoTradeAmount escrowAsaAmount ', algoTradeAmount, escrowAsaTradeAmount);
  // algoTradeAmount = algoTradeAmount / 2;

  console.debug('n: ', n, ' d: ', d, ' asset amount: ', escrowAsaTradeAmount);

  return {
    'algoTradeAmount': algoTradeAmount,
    'escrowAsaTradeAmount': escrowAsaTradeAmount,
    'executionFees': executionFees,
    'closeoutFromASABalance': closeoutFromASABalance,
  };
}

/**
 *
 * @param {*} orderBookEscrowEntry
 * @param {*} takerCombOrderBalance
 * @return {Object}
 */
function getExecuteAlgoOrderTakerTxnAmounts(
    orderBookEscrowEntry,
    takerCombOrderBalance,
) {
  console.debug('orderBookEscrowEntry, takerCombOrderBalance',
      dumpVar(orderBookEscrowEntry),
      dumpVar(takerCombOrderBalance));

  const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
  const orderBookEntry = orderBookEscrowEntry['orderEntry'];
  const currentEscrowAlgoBalance = orderBookEscrowEntry['algoBalance'];
  let algoAmountReceiving = orderBookEscrowEntry['algoBalance'];
  const assetId = orderBookEscrowEntry['assetId'];
  const takerAddr = takerCombOrderBalance['takerAddr'];

  console.debug('assetid: ' + assetId);

  const orderBookEntrySplit = orderBookEntry.split('-');
  const n = orderBookEntrySplit[0];
  const d = orderBookEntrySplit[1];

  const appAccts = [];
  appAccts.push(orderCreatorAddr);
  appAccts.push(takerAddr);
  // Call stateful contract

  const txnFee = 0.002 * 1000000;

  algoAmountReceiving -= txnFee; // this will be the transfer amount
  console.debug('here1');
  console.debug('takerOrderBalance: ' + toString(takerCombOrderBalance));
  console.debug('algoAmount: ' + algoAmountReceiving);

  const price = new BigN(d).divide(new BigN(n), 30);
  const bDecOne = new BigN(1);

  const emptyReturnVal = {
    'algoAmountReceiving': 0,
    'asaAmountSending': 0,
    'txnFee': 0,
  };

  if (algoAmountReceiving <= 0) {
    console.debug('here5');
    console.debug('can\'t afford, returning early');
    return emptyReturnVal; // can't afford any transaction!
  }
  algoAmountReceiving = new BigN(algoAmountReceiving);
  let asaAmount = algoAmountReceiving.divide(price, 30);
  console.debug('here6');
  console.debug('asa amount: ' + asaAmount.getValue());

  let hasSpecialCaseOkPrice = false;
  if (asaAmount.getValue().includes('.') &&
        asaAmount.compareTo(bDecOne) === LESS_THAN) {
    // Since we can only sell at least one unit, figure out the 'real' price we are selling at,
    // since we will need to adjust upwards the ASA amount to 1, giving a worse deal for the seller (taker)
    const adjPrice = asaAmount.multiply(price);
    const takerLimitPrice = new BigN(takerCombOrderBalance['limitPrice']);
    console.debug('here6a2 figuring out adjusted price for hasSpecialCaseGoodPrice',
        {adjPrice, asaAmount, price, takerLimitPrice});

    if (adjPrice.compareTo(takerLimitPrice) === GREATER_THAN) {
      hasSpecialCaseOkPrice = true;
    }
  }

  if (asaAmount.getValue().includes('.') &&
        asaAmount.compareTo(bDecOne) === LESS_THAN && hasSpecialCaseOkPrice) {
    console.debug('here6aa asa less than one, changing ASA amount to 1');
    asaAmount = bDecOne;
    algoAmountReceiving = price.multiply(bDecOne);
    if (algoAmountReceiving.getValue().includes('.')) {
      // give slightly worse deal for taker if decimal
      algoAmountReceiving = algoAmountReceiving.floor();
      console.debug('here6aa decreasing algoAmount due to decimal: ' + algoAmountReceiving.getValue());
    }
    if (new BigN(currentEscrowAlgoBalance).compareTo(algoAmountReceiving) === LESS_THAN) {
      algoAmountReceiving = new BigN(currentEscrowAlgoBalance);
    }

    algoAmountReceiving = algoAmountReceiving.subtract(new BigN(0.002 * 1000000)); // reduce for fees
  } else if (asaAmount.getValue().includes('.')) {
    // round down decimals. possibly change this later?
    asaAmount = asaAmount.floor();

    console.debug('here7');
    console.debug('increasing from decimal asa amount: ' + asaAmount.getValue());

    // recalculating receiving amount
    // use math.floor to give slightly worse deal for taker
    algoAmountReceiving = asaAmount.multiply(price).floor();
    console.debug('recalculating receiving amount to: ' + algoAmountReceiving.getValue());
  }

  if (new BigN(takerCombOrderBalance['asaBalance']).compareTo(asaAmount) === LESS_THAN) {
    console.debug('here8');
    console.debug('here8 reducing asa amount due to taker balance: ', asaAmount.getValue());
    asaAmount = new BigN(takerCombOrderBalance['asaBalance']);
    console.debug('here8 asa amount is now: ', asaAmount.getValue());

    algoAmountReceiving = price.multiply(asaAmount);
    console.debug('here9');
    console.debug('recalculating algoamount: ' + algoAmountReceiving.getValue());
    if (algoAmountReceiving.getValue().includes('.')) {
      // give slightly worse deal for taker if decimal
      algoAmountReceiving = algoAmountReceiving.floor();
      console.debug('here10 increasing algoAmount due to decimal: ' + algoAmountReceiving.getValue());
    }
  }

  console.debug('almost final ASA amount: ' + asaAmount.getValue());

  // These are expected to be integers now
  algoAmountReceiving = parseInt(algoAmountReceiving.getValue());
  asaAmount = parseInt(asaAmount.getValue());

  algoAmountReceiving = Math.max(0, algoAmountReceiving);

  return {
    'algoAmountReceiving': algoAmountReceiving,
    'asaAmountSending': asaAmount,
    'txnFee': txnFee,
  };
}

/**
 * @deprecated
 * @param {*} orderBookEscrowEntry
 * @param {*} algodClient
 * @param {*} lsig
 * @param {*} takerCombOrderBalance
 * @param {*} params
 * @param {*} walletConnector
 * @return {Promise<*>}
 */
async function getExecuteAlgoOrderTxnsAsTakerV2(
    orderBookEscrowEntry,
    algodClient,
    lsig,
    takerCombOrderBalance,
    params,
    walletConnector,
) {
  try {
    console.debug('in getExecuteAlgoOrderTxnsAsTaker');
    console.debug('orderBookEscrowEntry, algodClient, takerCombOrderBalance',
        toString(orderBookEscrowEntry), algodClient,
        takerCombOrderBalance);

    const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
    const orderBookEntry = orderBookEscrowEntry['orderEntry'];
    const appId = ALGO_ESCROW_ORDER_BOOK_ID;
    const currentEscrowAlgoBalance = orderBookEscrowEntry['algoBalance'];
    const assetId = orderBookEscrowEntry['assetId'];
    const takerAddr = takerCombOrderBalance['takerAddr'];

    console.debug('assetid: ' + assetId);

    const retTxns = [];
    const appArgs = [];
    const enc = new TextEncoder();

    const appAccts = [];
    appAccts.push(orderCreatorAddr);
    appAccts.push(takerAddr);
    // Call stateful contract

    let closeRemainderTo = undefined;
    // fees refunded to escrow in case of partial execution
    const refundFees = 0.002 * 1000000;

    const {algoAmountReceiving, asaAmountSending, txnFee} =
            getExecuteAlgoOrderTakerTxnAmounts(
                orderBookEscrowEntry,
                takerCombOrderBalance,
            );

    if (algoAmountReceiving === 0) {
      console.debug('algoAmountReceiving is 0, nothing to do, returning early');
      return null;
    }

    takerCombOrderBalance['algoBalance'] -= txnFee;
    takerCombOrderBalance['algoBalance'] += algoAmountReceiving;
    takerCombOrderBalance['asaBalance'] -= asaAmountSending;
    console.debug(
        'here11 algoAmount asaAmount txnFee takerOrderBalance: ',
        algoAmountReceiving,
        asaAmountSending,
        txnFee,
        toString(takerCombOrderBalance),
    );

    console.debug(
        'receiving ' + algoAmountReceiving + ' from  ' + lsig.address(),
    );
    console.debug(
        'sending ASA amount ' + asaAmountSending + ' to ' + orderCreatorAddr,
    );
    if (currentEscrowAlgoBalance - algoAmountReceiving < constants.MIN_ESCROW_BALANCE) {
      closeRemainderTo = orderCreatorAddr;
    }
    if (orderBookEscrowEntry.useForceShouldCloseOrNot) {
      if (orderBookEscrowEntry.forceShouldClose === true) {
        closeRemainderTo = orderCreatorAddr;
      } else {
        closeRemainderTo = undefined;
      }
    }
    let appCallType = null;
    if (typeof closeRemainderTo === 'undefined') {
      appCallType = 'execute';
    } else {
      appCallType = 'execute_with_closeout';
    }
    console.debug('arg1: ' + appCallType);
    console.debug('arg2: ' + orderBookEntry);

    appArgs.push(enc.encode(appCallType));
    appArgs.push(enc.encode(orderBookEntry));
    if (orderBookEscrowEntry.txnNum != null) {
      // uniquify this transaction even if this arg isn't used
      appArgs.push(enc.encode(orderBookEscrowEntry.txnNum));
    }
    // appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);
    console.debug(appArgs.length);

    let transaction1 = null;

    if (typeof closeRemainderTo === 'undefined') {
      transaction1 = algosdk.makeApplicationNoOpTxn(
          lsig.address(),
          params,
          appId,
          appArgs,
          appAccts,
      );
    } else {
      transaction1 = algosdk.makeApplicationCloseOutTxn(
          lsig.address(),
          params,
          appId,
          appArgs,
          appAccts,
      );
    }

    // Make payment tx signed with lsig
    const transaction2 = algosdk.makePaymentTxnWithSuggestedParams(
        lsig.address(),
        takerAddr,
        algoAmountReceiving,
        closeRemainderTo,
        undefined,
        params,
    );
    // Make asset xfer

    const transaction3 = {
      type: 'axfer',
      from: takerAddr,
      to: orderCreatorAddr,
      amount: asaAmountSending,
      assetIndex: assetId,
      ...params,
    };

    let transaction4 = null;

    if (typeof closeRemainderTo === 'undefined') {
      // create refund transaction for fees
      transaction4 = {
        type: 'pay',
        from: takerAddr,
        to: lsig.address(),
        amount: refundFees,
        ...params,
      };
    }

    //  delete fixedTxn1.note;
    delete transaction3.note;
    // delete fixedTxn1.lease;
    delete transaction3.lease;
    delete transaction3.appArgs;

    // TODO: Fixme!
    // myAlgoWalletUtil.setTransactionFee(fixedTxn1);
    // myAlgoWalletUtil.setTransactionFee(transaction3);

    let txns = [transaction1, transaction2, transaction3];
    if (transaction4 != null) {
      txns.push(transaction4);
    }

    if (typeof closeRemainderTo === 'undefined') {
      txns = formatTransactionsWithMetadata(
          txns,
          takerAddr,
          orderBookEscrowEntry,
          'execute_partial',
          'algo',
      );
    } else {
      txns = formatTransactionsWithMetadata(
          txns,
          takerAddr,
          orderBookEscrowEntry,
          'execute_full',
          'algo',
      );
    }

    // algosdk.assignGroupID(txns);

    if (!!walletConnector && walletConnector.connector.connected) {
      retTxns.push({
        'unsignedTxn': transaction1,
        'lsig': lsig,
      });
      retTxns.push({
        'unsignedTxn': transaction2,
        'amount': transaction2.amount,
        'lsig': lsig,
        'txType': 'algo',
      });


      retTxns.push({
        'unsignedTxn': transaction3,
        'needsUserSig': true,
        'amount': transaction3.amount,
        'txType': 'asa',
        'lsig': lsig,
      });

      if (transaction4) {
        retTxns.push({
          'unsignedTxn': transaction4,
          'needsUserSig': true,
        });
      }
      return retTxns;
    }

    retTxns.push({
      'unsignedTxn': transaction1,
      'lsig': lsig,
    });
    retTxns.push({
      'unsignedTxn': transaction2,
      'amount': transaction2.amount,
      'lsig': lsig,
      'txType': 'algo',
    });
    // console.debug('almost final ASA amount: ' + asaAmount.getValue());

    // These are expected to be integers now
    // algoAmountReceiving = parseInt(algoAmountReceiving.getValue());
    // asaAmount = parseInt(asaAmount.getValue());

    retTxns.push({
      'unsignedTxn': transaction3,
      'needsUserSig': true,
      'amount': transaction3.amount,
      'txType': 'asa',
      'lsig': lsig,
    });

    if (transaction4) {
      retTxns.push({
        'unsignedTxn': transaction4,
        'needsUserSig': true,
      });
    }
    return retTxns;
  } catch (e) {
    console.debug(e);
    if (typeof e.text !== 'undefined') {
      alert(e.text);
    } else {
      alert(e);
    }
  }
}

/**
 * @deprecated
 * @param {*} algodClient
 * @param {*} escrowAddr
 * @param {*} creatorAddr
 * @param {*} index
 * @param {*} appArgs
 * @param {*} lsig
 * @param {*} assetId
 * @param {*} metadata
 * @param {*} walletConnector
 * @return {Promise<*>}
 */
async function closeASAOrderV2(
    algodClient,
    escrowAddr,
    creatorAddr,
    index,
    appArgs,
    lsig,
    assetId,
    metadata,
    walletConnector,
) {
  console.debug('closing asa order!!!');

  // TODO: Fixme useless catch
  try {
    // get node suggested parameters
    const params = await algodClient.getTransactionParams().do();

    // create unsigned transaction
    const txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, index, appArgs);
    const txId = txn.txID().toString();
    // Submit the transaction

    // create optin transaction
    // sender and receiver are both the same
    const sender = lsig.address();
    const recipient = creatorAddr;
    // We set revocationTarget to undefined as
    // This is not a clawback operation
    const revocationTarget = undefined;
    // CloseReaminerTo is set to undefined as
    // we are not closing out an asset
    const closeRemainderTo = creatorAddr;
    // We are sending 0 assets
    const amount = 0;

    // signing and sending "txn" allows sender to begin accepting asset
    // specified by creator and index
    const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender,
        recipient,
        closeRemainderTo,
        revocationTarget,
        amount,
        undefined,
        assetId,
        params,
    );

    // Make payment tx signed with lsig
    const txn3 = algosdk.makePaymentTxnWithSuggestedParams(
        lsig.address(),
        creatorAddr,
        0,
        creatorAddr,
        undefined,
        params,
    );

    const txn4 = {
      type: 'pay',
      from: creatorAddr,
      to: creatorAddr,
      amount: 0,
      ...params,
    };

    let txns = [txn, txn2, txn3, txn4];


    const makerAccountInfo = await getAccountInfo(creatorAddr);
    const escrowAccountInfo = await getAccountInfo(escrowAddr);

    const noteMetadata = {
      algoBalance: makerAccountInfo.amount,
      asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
      assetId: assetId,
      n: metadata.n,
      d: metadata.d,
      orderEntry: metadata.orderBookEntry,
      version: metadata.version,
      escrowAddr: escrowAccountInfo.address,
      escrowOrderType: 'close',
      txType: 'close',
      isASAescrow: true,
    };

    txns = formatTransactionsWithMetadata(
        txns,
        creatorAddr,
        noteMetadata,
        'close',
        'asa',
    );


    const retTxns = [];
    retTxns.push({
      'unsignedTxn': txn,
      'lsig': lsig,
    });
    retTxns.push({
      'unsignedTxn': txn2,
      'lsig': lsig,
    });


    retTxns.push({
      'unsignedTxn': txn3,
      'lsig': lsig,
    });

    retTxns.push({
      'unsignedTxn': txn4,
      'needsUserSig': true,
    });
    if (!!walletConnector && walletConnector.connector.connected) {
      // TODO: fixme!
      const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, retTxns, params, walletConnector);
      return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
    } else {
      const singedGroupedTransactions = await signingApi.signMyAlgoTransactions(retTxns);
      return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
    }
  } catch (e) {
    throw e;
  }
}

/**
 * @deprecated
 * @param {*} orderBookEscrowEntry
 * @param {Algodv2} algodClient
 * @param {*} lsig
 * @param {*} takerCombOrderBalance
 * @param {*} params
 * @param {*} walletConnector
 * @return {null|*[]}
 */
function getExecuteASAOrderTxnsV2(orderBookEscrowEntry, algodClient,
    lsig, takerCombOrderBalance, params, walletConnector) {
  console.debug('inside executeASAOrder!', toString(takerCombOrderBalance));
  console.debug('orderBookEscrowEntry ', toString(orderBookEscrowEntry));
  try {
    const retTxns = [];
    const appAccts = [];

    const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
    const orderBookEntry = orderBookEscrowEntry['orderEntry'];
    const appId = ASA_ESCROW_ORDER_BOOK_ID;
    const takerAddr = takerCombOrderBalance['takerAddr'];

    const assetId = orderBookEscrowEntry['assetId'];

    appAccts.push(orderCreatorAddr);
    appAccts.push(takerAddr);

    let closeRemainderTo = undefined;

    // fees refunded to escrow in case of partial execution
    const refundFees = 0.002 * 1000000;

    const {
      algoTradeAmount, escrowAsaTradeAmount, executionFees,
      closeoutFromASABalance: initialCloseoutFromASABalance,
    } = getExecuteASAOrderTakerTxnAmounts(
        takerCombOrderBalance,
        orderBookEscrowEntry,
    );

    if (algoTradeAmount === 0) {
      console.debug('nothing to do, returning early');
      return null;
    }

    let closeoutFromASABalance = initialCloseoutFromASABalance;
    console.debug('closeoutFromASABalance here111: ' + closeoutFromASABalance);
    if (orderBookEscrowEntry.useForceShouldCloseOrNot) {
      closeoutFromASABalance = orderBookEscrowEntry.forceShouldClose;
      console.debug(
          'closeoutFromASABalance here222: ' + closeoutFromASABalance,
      );
    }

    takerCombOrderBalance['algoBalance'] -= executionFees;
    takerCombOrderBalance['algoBalance'] -= algoTradeAmount;
    takerCombOrderBalance['walletAlgoBalance'] -= executionFees;
    takerCombOrderBalance['walletAlgoBalance'] -= algoTradeAmount;

    takerCombOrderBalance['asaBalance'] += escrowAsaTradeAmount;
    takerCombOrderBalance['walletASABalance'] += escrowAsaTradeAmount;
    console.debug(
        'ASA here110 algoAmount asaAmount txnFee takerOrderBalance: ',
        algoTradeAmount,
        escrowAsaTradeAmount,
        executionFees,
        toString(takerCombOrderBalance),
    );

    console.debug(
        'receiving ASA ' + escrowAsaTradeAmount + ' from  ' + lsig.address(),
    );
    console.debug(
        'sending ALGO amount ' + algoTradeAmount + ' to ' + orderCreatorAddr,
    );

    if (closeoutFromASABalance === true) {
      // only closeout if there are no more ASA in the account
      console.debug(
          'closeoutFromASABalance here333: ' + closeoutFromASABalance,
      );
      closeRemainderTo = orderCreatorAddr;
    }
    let transaction1 = null;
    let appCallType = null;

    if (typeof closeRemainderTo === 'undefined') {
      appCallType = 'execute';
    } else {
      appCallType = 'execute_with_closeout';
    }

    const appArgs = [];
    const enc = new TextEncoder();
    appArgs.push(enc.encode(appCallType));
    appArgs.push(enc.encode(orderBookEntry));

    if (orderBookEscrowEntry.txnNum != null) {
      // uniquify this transaction even if this arg isn't used
      appArgs.push(enc.encode(orderBookEscrowEntry.txnNum));
    }

    // appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);
    // appArgs.push(enc.encode(assetId));

    console.debug(appArgs.length);


    if (typeof closeRemainderTo === 'undefined') {
      transaction1 = algosdk.makeApplicationNoOpTxn(
          lsig.address(),
          params,
          appId,
          appArgs,
          appAccts,
          [0],
          [assetId],
      );
    } else {
      transaction1 = algosdk.makeApplicationCloseOutTxn(
          lsig.address(),
          params,
          appId,
          appArgs,
          appAccts,
          [0],
          [assetId],
      );
    }


    console.debug('app call type is: ' + appCallType);

    const fixedTxn2 = {
      type: 'pay',
      from: takerAddr,
      to: orderCreatorAddr,
      amount: algoTradeAmount,
      ...params,
    };
    // ***
    const takerAlreadyOptedIntoASA = takerCombOrderBalance.takerIsOptedIn;
    console.debug({takerAlreadyOptedIntoASA});

    // asset opt-in transfer
    let transaction2b = null;

    if (!takerAlreadyOptedIntoASA) {
      transaction2b = {
        type: 'axfer',
        from: takerAddr,
        to: takerAddr,
        amount: 0,
        assetIndex: assetId,
        ...params,
      };
    }

    // Make asset xfer

    // Asset transfer from escrow account to order executor
    const transaction3 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        lsig.address(),
        takerAddr,
        closeRemainderTo,
        undefined,
        escrowAsaTradeAmount,
        undefined,
        assetId,
        params,
    );


    let transaction4 = null;
    if (typeof closeRemainderTo !== 'undefined') {
      // Make payment tx signed with lsig back to owner creator
      console.debug('making transaction4 due to closeRemainderTo');
      transaction4 = algosdk.makePaymentTxnWithSuggestedParams(
          lsig.address(),
          orderCreatorAddr,
          0,
          orderCreatorAddr,
          undefined,
          params,
      );
    } else {
      // Make fee refund transaction
      transaction4 = {
        type: 'pay',
        from: takerAddr,
        to: lsig.address(),
        amount: refundFees,
        ...params,
      };
    }

    // TODO: Fixme!
    // myAlgoWalletUtil.setTransactionFee(fixedTxn2);
    //
    // if (transaction2b != null) {
    //     myAlgoWalletUtil.setTransactionFee(transaction2b);
    // }


    let txns = [];
    txns.push(transaction1);
    txns.push(fixedTxn2);
    if (transaction2b != null) {
      console.debug('adding transaction2b due to asset not being opted in');
      txns.push(transaction2b);
    } else {
      console.debug('NOT adding transaction2b because already opted');
    }
    txns.push(transaction3);
    txns.push(transaction4);

    if (typeof closeRemainderTo !== 'undefined') {
      txns = formatTransactionsWithMetadata(
          txns,
          takerAddr,
          orderBookEscrowEntry,
          'execute_full',
          'asa',
      );
    } else {
      txns = formatTransactionsWithMetadata(
          txns,
          takerAddr,
          orderBookEscrowEntry,
          'execute_partial',
          'asa',
      );
    }


    // it goes by reference so modifying array affects
    // individual objects and vice versa

    if (!!walletConnector && walletConnector.connector.connected) {
      retTxns.push({
        'unsignedTxn': transaction1,
        'lsig': lsig,
      });
      retTxns.push({
        'unsignedTxn': fixedTxn2,
        'needsUserSig': true,
        'amount': fixedTxn2.amount,
        'txType': 'algo',
      });

      if (transaction2b != null) {
        retTxns.push({
          'unsignedTxn': transaction2b,
          'needsUserSig': true,
        });
      }
      retTxns.push({
        'unsignedTxn': transaction3,
        'amount': escrowAsaTradeAmount,
        'txType': 'asa',
        'lsig': lsig,
      });

      if (!isUndefined(closeRemainderTo)) {
        retTxns.push({
          'unsignedTxn': transaction4,
          'lsig': lsig,
        });
      } else {
        retTxns.push({
          'unsignedTxn': transaction4,
          'needsUserSig': true,
        });
      }

      return retTxns;
    }

    retTxns.push({
      'unsignedTxn': transaction1,
      'lsig': lsig,
    });
    retTxns.push({
      'unsignedTxn': fixedTxn2,
      'needsUserSig': true,
      'amount': fixedTxn2.amount,
      'txType': 'algo',
    });

    if (transaction2b != null) {
      retTxns.push({
        'unsignedTxn': transaction2b,
        'needsUserSig': true,
      });
    }
    retTxns.push({
      'unsignedTxn': transaction3,
      'amount': escrowAsaTradeAmount,
      'txType': 'asa',
      'lsig': lsig,
    });

    if (typeof closeRemainderTo !== 'undefined') {
      retTxns.push({
        'unsignedTxn': transaction4,
        'lsig': lsig,
      });
    } else {
      retTxns.push({
        'unsignedTxn': transaction4,
        'needsUserSig': true,
      });
    }

    return retTxns;
  } catch (e) {
    console.debug(e);
    if (typeof e.text !== 'undefined') {
      alert(e.text);
    } else {
      alert(e);
    }
  }
}

/**
 * @deprecated
 * @param {*} algod_port
 */
function setAlgodPort(algod_port) {
  ALGOD_PORT = algod_port;
}

/**
 * @deprecated
 * @param {*} algod_server
 */
function setAlgodServer(algod_server) {
  ALGOD_SERVER = algod_server;
}

/**
 * @deprecated
 * @param {*} server
 * @param {*} port
 * @param {*} token
 */
function setAlgodIndexer(server, port, token) {
  ALGOD_INDEXER_SERVER = server;
  ALGOD_INDEXER_PORT = port;
  ALGOD_INDEXER_TOKEN = token;
}

/**
 * @deprecated
 * @param {*} algod_token
 */
function setAlgodToken(algod_token) {
  ALGOD_TOKEN = algod_token;
}

/**
 * @deprecated
 * @param {*} items
 * @param {*} key
 * @return {*}
 */
function groupBy(items, key) {
  return items.reduce(
      (result, item) => ({
        ...result,
        [item[key]]: [
          ...(result[item[key]] || []),
          item,
        ],
      }),
      {},
  );
}

/**
 * @deprecated
 * @param {*} algodClient
 * @param {*} escrowAddr
 * @param {*} creatorAddr
 * @param {*} appIndex
 * @param {*} appArgs
 * @param {*} lsig
 * @param {*} metadata
 * @param {*} walletConnector
 * @return {Promise<*>}
 */
async function closeOrderV2(
    algodClient,
    escrowAddr,
    creatorAddr,
    appIndex,
    appArgs,
    lsig,
    metadata,
    walletConnector,
) {
  const accountInfo = await getAccountInfo(lsig.address());
  const alreadyOptedIn = false;
  if (accountInfo != null && accountInfo['assets'] != null &&
    accountInfo['assets'].length > 0 && accountInfo['assets'][0] != null) {
    await closeASAOrderV2(
        algodClient,
        escrowAddr,
        creatorAddr,
        appIndex,
        appArgs,
        lsig,
        metadata,
        walletConnector,
    );
    return;
  }

  try {
    // get node suggested parameters
    const params = await algodClient.getTransactionParams().do();

    // create unsigned transaction
    const txn = algosdk.makeApplicationClearStateTxn(
        lsig.address(),
        params,
        appIndex,
        appArgs,
    );
    // const txId = txn.txID().toString();
    // Submit the transaction

    // Make payment tx signed with lsig
    const txn2 = algosdk.makePaymentTxnWithSuggestedParams(
        lsig.address(),
        creatorAddr,
        0,
        creatorAddr,
        undefined,
        params,
    );

    const txn3 = {
      type: 'pay',
      from: creatorAddr,
      to: creatorAddr,
      amount: 0,
      ...params,
    };

    // TODO: Fixme!
    // myAlgoWalletUtil.setTransactionFee(txn3);

    const makerAccountInfo = await getAccountInfo(creatorAddr);
    const escrowAccountInfo = await getAccountInfo(escrowAddr);

    const noteMetadata = {
      algoBalance: makerAccountInfo.amount,
      asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
      n: metadata.n,
      d: metadata.d,
      orderEntry: metadata.orderBookEntry,
      assetId: 0,
      version: metadata.version,
      escrowAddr: escrowAccountInfo.address,
      escrowOrderType: 'close',
      txType: 'close',
      isASAescrow: true,
    };

    const retTxns = [];
    retTxns.push({
      'unsignedTxn': txn,
      'lsig': lsig,
    });
    retTxns.push({
      'unsignedTxn': txn2,
      'lsig': lsig,
    });

    retTxns.push({
      'unsignedTxn': txn3,
      'needsUserSig': true,
    });
    if (!!walletConnector && walletConnector.connector.connected) {
      const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, retTxns, params, walletConnector);

      return await signingApi.propogateTransactions(
          algodClient,
          singedGroupedTransactions,
      );
    } else {
      const singedGroupedTransactions = await signingApi.signMyAlgoTransactions(
          retTxns,
      );

      return await signingApi.propogateTransactions(
          algodClient,
          singedGroupedTransactions,
      );
    }
  } catch (e) {
    throw e;
  }
}

/**
 * @deprecated
 * @param algodClient
 * @param makerWalletAddr
 * @param n
 * @param d
 * @param min
 * @param assetId
 * @param assetAmount
 * @param signAndSend
 * @param walletConnector
 * @return {Promise<*[]|*>}
 */
async function getPlaceASAToSellASAOrderIntoOrderbookV2(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, signAndSend, walletConnector) {
  console.debug('checking assetId type');
  assetId = parseInt(assetId + '');

  const outerTxns = [];

  const program = buildDelegateTemplateFromArgs(min, assetId, n, d, makerWalletAddr, true, constants.ESCROW_CONTRACT_VERSION);

  const lsig = await getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
  const generatedOrderEntry = generateOrder(makerWalletAddr, n, d, min, assetId);
  console.debug('address is: ' + lsig.address());

  const makerAccountInfo = await getAccountInfo(makerWalletAddr);
  // check if the lsig has already opted in
  const accountInfo = await getAccountInfo(lsig.address());
  let alreadyOptedIn = false;
  if (accountInfo != null && accountInfo['apps-local-state'] != null &&
    accountInfo['apps-local-state'].length > 0 &&
    accountInfo['apps-local-state'][0].id == ASA_ESCROW_ORDER_BOOK_ID) {
    alreadyOptedIn = true;
  }
  console.debug('alreadyOptedIn: ' + alreadyOptedIn);
  console.debug('acct info:' + JSON.stringify(accountInfo));

  const params = await algodClient.getTransactionParams().do();
  console.debug('sending trans to: ' + lsig.address());

  const assetSendTrans = {
    ...params,
    fee: 1000,
    flatFee: true,
    type: 'axfer',
    assetIndex: assetId,
    from: makerWalletAddr,
    to: lsig.address(),
    amount: assetAmount,
  };
  const noteMetadata = {
    algoBalance: makerAccountInfo.amount,
    asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
    assetId: assetId,
    n: n,
    d: d,
    escrowAddr: accountInfo.address,
    orderEntry: generatedOrderEntry,
    escrowOrderType: 'sell',
    version: constants.ESCROW_CONTRACT_VERSION,
  };

  console.debug('herez88888 ', dumpVar(assetSendTrans));


  if (alreadyOptedIn) {
    outerTxns.push({
      unsignedTxn: assetSendTrans,
      needsUserSig: true,
    });

    // Below Conditional is neccessarry for when an order is already open and the maker is just adding more asset value into it
    if (signAndSend) {
      unsignedTxns = [];
      for (let i = 0; i < outerTxns.length; i++) {
        unsignedTxns.push(outerTxns[i].unsignedTxn);
      }

      unsignedTxns = formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, 'open', 'asa');
      if (!!walletConnector && walletConnector.connector.connected) {
        const signedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector);

        return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
      } else {
        const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(outerTxns);
        return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
      }
    } else {
      return outerTxns;
    }
  }

  const payTxn = {
    ...params,
    type: 'pay',
    from: makerWalletAddr,
    to: lsig.address(),
    amount: constants.MIN_ASA_ESCROW_BALANCE, // fund with enough to subtract from later
  };

  // TODO: FixME
  // myAlgoWalletUtil.setTransactionFee(payTxn);

  console.debug('typeof: ' + typeof payTxn.txId);
  console.debug('the val: ' + payTxn.txId);

  const payTxId = payTxn.txId;
  // console.debug("confirmed!!");
  // create unsigned transaction

  console.debug('here3 calling app from logic sig to open order');
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('open'));
  console.debug('before slice: ' + generatedOrderEntry);
  console.debug(generatedOrderEntry.slice(59));
  console.debug('after slice: ' + generatedOrderEntry.slice(59));

  appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
  appArgs.push(new Uint8Array([constants.ESCROW_CONTRACT_VERSION]));

  // add owners address as arg
  // ownersAddr = "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI";
  // ownersBitAddr = (algosdk.decodeAddress(ownersAddr)).publicKey;
  console.debug(appArgs.length);

  const logSigTrans = await createTransactionFromLogicSig(algodClient, lsig,
      ASA_ESCROW_ORDER_BOOK_ID, appArgs, 'appOptIn', params);

  // create optin transaction
  // sender and receiver are both the same
  const sender = lsig.address();
  const recipient = sender;
  // We set revocationTarget to undefined as
  // This is not a clawback operation
  const revocationTarget = undefined;
  // CloseReaminerTo is set to undefined as
  // we are not closing out an asset
  const closeRemainderTo = undefined;
  // We are sending 0 assets
  const amount = 0;

  // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
  const logSigAssetOptInTrans = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo,
      revocationTarget,
      amount, undefined, assetId, params);

  outerTxns.push({
    unsignedTxn: payTxn,
    needsUserSig: true,
  });
  outerTxns.push({
    unsignedTxn: logSigTrans,
    needsUserSig: false,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: logSigAssetOptInTrans,
    needsUserSig: false,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: assetSendTrans,
    needsUserSig: true,
  });

  unsignedTxns = [];
  for (let i = 0; i < outerTxns.length; i++) {
    unsignedTxns.push(outerTxns[i].unsignedTxn);
  }
  // Check if just coincidence that asa balance in question is Always at the top of the asset array, if it is then make function to filter relevant balance via assetId
  // Also look into modifying internal methods to have more consistent naming ex. (getAlgotoBuy and getAsaToSell would have same naming scheme of makerAccountInfo and EscrowAccountInfo)

  unsignedTxns = formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, 'open', 'asa');
  if (signAndSend) {
    if (!!walletConnector && walletConnector.connector.connected) {
      const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector);
      return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
    }
    const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(outerTxns);
    return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
  }

  return outerTxns;
}
// --------------------------------Module Exports ------------------------------
module.exports = {
  dumpVar,
  doAlert,
  generateOrder,
  assignGroups,
  getConstants,
  allSettled,
  initSmartContracts,
  getOrderBookId,
  getMinWalletBalance,
  initIndexer,
  initAlgodClient,
  waitForConfirmation,
  getNumeratorAndDenominatorFromPrice,
  createOrderBookEntryObj,
  getCutOrderTimes,
  executeOrder,
  closeOrderFromOrderBookEntry,
  finalPriceCheck,
  getAlgoandAsaAmounts,
  signAndSendWalletConnectTransactions,
  signAndSendTransactions,
  getPlaceAlgosToBuyASAOrderIntoOrderbook,
  executeMarketOrder,
  getPlaceASAToSellASAOrderIntoOrderbook,
  printTransactionDebug,
  buildDelegateTemplateFromArgs,
  getLsigFromProgramSource,
  getAccountInfo,
  groupBy,
  doAlertInternal,
  createTransactionFromLogicSig,
  getExecuteOrderTransactionsAsTakerFromOrderEntry,
  closeASAOrder,
  setAlgodServer,
  setAlgodToken,
  setAlgodPort,
  setAlgodIndexer,
  getExecuteASAOrderTakerTxnAmounts,
  getExecuteASAOrderTxnsV2,
  getExecuteASAOrderTxns,
  getExecuteAlgoOrderTakerTxnAmounts,
  getExecuteAlgoOrderTxnsAsTakerV2,
  getExecuteAlgoOrderTxnsAsTaker,
  getQueuedTakerOrders,
  closeASAOrderV2,
  closeOrderV2,
  closeOrder,
  compileProgram,
  _base64ToArrayBuffer,
  formatTransactionsWithMetadata,
  getPlaceASAToSellASAOrderIntoOrderbookV2,
  getPlaceAlgosToBuyASAOrderIntoOrderbookV2,
};
