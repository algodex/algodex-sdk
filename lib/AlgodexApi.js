// ///////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
// ///////////////////////////


const http = require('http');
const algosdk = require('algosdk');
const {formatJsonRpcRequest} = require('@json-rpc-tools/utils');
const BigN = require('js-big-decimal');
const deprecate = require('./utils/deprecate.js');

const LESS_THAN = -1;
const EQUAL = 0;
const GREATER_THAN = 1;

let MyAlgo = null;
let myAlgoWalletUtil = null;
if (typeof window != 'undefined') {
  MyAlgo = require('@randlabs/myalgo-connect');
  myAlgoWalletUtil = require('./functions/MyAlgoWalletUtil.js');
}
if (process.env.NODE_ENV === 'test') {
  myAlgoWalletUtil = require('./functions/MyAlgoWalletUtil.js');
  MyAlgo = function TestMyAlgo() {
    if (!new.target) {
      throw Error('Cannot be called without the new keyword');
    }
    this.signTransaction = (txns) => {
      return txns.map((txn) => {
        return {txn: txn, blob: 'fakeBlob'};
      });
    };
  };
}
require('../algo_delegate_template_teal.js');
require('../ASA_delegate_template_teal.js');
// require('./dex_teal.js');

const dexInternal = require('../algodex_internal_api.js');
const helperFuncs = require('./functions/helperFunctions.js');

if (MyAlgo != null) {
  myAlgoWallet = new MyAlgo();
  // console.debug("printing my algo wallet");
  // console.debug(myAlgoWallet)
}

const constants = require('./constants.js');
const {ESCROW_CONTRACT_VERSION} = require('./constants.js');

const ALGO_ESCROW_ORDER_BOOK_ID = -1;
const ASA_ESCROW_ORDER_BOOK_ID = -1;


function doAlert() {
  const {doAlert} = require('./functions/base');
  // console.log(AlgodexInternalApi)
  // alert(1);
  // console.debug("api call!!!");
  return doAlert();
}

function getConstants() {
  const {getConstants} = require('./functions/base');
  return getConstants();
}

function allSettled(promises) {
  const {allSettled} = require('./functions/base');
  return allSettled(promises);
}

function initSmartContracts(environment) {
  const {initSmartContracts} = require('./functions/base');
  return initSmartContracts(environment);
}

function getOrderBookId(isAlgoEscrowApp) {
  const {getOrderBookId} = require('./functions/base');
  return getOrderBookId(isAlgoEscrowApp);
}
async function getMinWalletBalance(accountInfo, includesFullAccountInfo = false) {
  const {getMinWalletBalance} = require('./functions/base');
  return getMinWalletBalance(accountInfo, includesFullAccountInfo);
}

function initIndexer(environment) {
  const {initIndexer} = require('./functions/base');
  return initIndexer(environment);
}

function initAlgodClient(environment) {
  const {initAlgodClient} = require('./functions/base');
  return initAlgodClient(environment);
}

async function waitForConfirmation(txId) {
  const {waitForConfirmation} = require('./functions/base');
  return waitForConfirmation(txId);
}

function dumpVar(x) {
  const {dumpVar} = require('./functions/base');
  return dumpVar(x);
}

function getNumeratorAndDenominatorFromPrice(limitPrice) {
  const {getNumeratorAndDenominatorFromPrice} = require('./functions/base');
  return getNumeratorAndDenominatorFromPrice(limitPrice);
}

function createOrderBookEntryObj(blockChainOrderVal, price, n, d, min, escrowAddr,
    algoBalance, asaBalance, escrowOrderType, isASAEscrow, orderCreatorAddr, assetId, version = 3) {
  const {createOrderBookEntryObj} = require('./functions/base');
  return createOrderBookEntryObj(blockChainOrderVal, price, n, d, min, escrowAddr,
      algoBalance, asaBalance, escrowOrderType, isASAEscrow, orderCreatorAddr, assetId, version);
}

function getCutOrderTimes(queuedOrder) {
  const {getCutOrderTimes} = require('./functions/base');
  return getCutOrderTimes(queuedOrder);
}

async function executeOrder(algodClient, isSellingASA, assetId,
    userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker, walletConnector) {
  const {executeOrder} = require('./functions/base');
  return executeOrder(algodClient, isSellingASA, assetId,
      userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker, walletConnector);
}

async function closeOrderFromOrderBookEntry(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry, version) {
  const {closeOrderFromOrderBookEntry} = require('./functions/base');
  return closeOrderFromOrderBookEntry(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry, version);
}
function assignGroups(txns) {
  const {assignGroups} = require('./functions/base');
  return assignGroups(txns);
}

function finalPriceCheck(algoAmount, asaAmount, limitPrice, isSellingASA) {
  const {finalPriceCheck} = require('./functions/base');
  return finalPriceCheck(algoAmount, asaAmount, limitPrice, isSellingASA);
}

function getAlgoandAsaAmounts(txnList) {
  const {getAlgoandAsaAmounts} = require('./functions/base');
  return getAlgoandAsaAmounts(txnList);
}

async function signAndSendWalletConnectTransactions(algodClient, outerTxns, params, walletConnector) {
  const {signAndSendWalletConnectTransactions} = require('./functions/base');
  return signAndSendWalletConnectTransactions(algodClient, outerTxns, params, walletConnector);
}

async function signAndSendTransactions(algodClient, outerTxns, params, walletConnector) {
  const {signAndSendTransactions} = require('./functions/base');
  return signAndSendTransactions(algodClient, outerTxns);
}

function generateOrder(makerWalletAddr, n, d, min, assetId, includeMakerAddr) {
  const {generateOrder} = require('./functions/base');
  return generateOrder(makerWalletAddr, n, d, min, assetId, includeMakerAddr);
}

async function
getPlaceAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, signAndSend, walletConnector) {
  const {getPlaceAlgosToBuyASAOrderIntoOrderbook} = require('./functions/base');
  return getPlaceAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, signAndSend, walletConnector);
}

async function executeMarketOrder(algodClient, isSellingASA, assetId,
    userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker, walletConnector) {
  const {executeMarketOrder} = require('./functions/base');
  return executeMarketOrder(algodClient, isSellingASA, assetId,
      userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker, walletConnector);
}

async function getPlaceASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, signAndSend, walletConnector) {
  const {getPlaceASAToSellASAOrderIntoOrderbook} = require('./functions/base');
  return getPlaceASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, signAndSend, walletConnector);
}

function printTransactionDebug(signedTxns) {
  const {printTransactionDebug} = require('./functions/base');
  return printTransactionDebug(signedTxns);
}

function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version = 3) {
  const {buildDelegateTemplateFromArgs} = require('./functions/base');
  return buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version);
}

async function getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource) {
  const {getLsigFromProgramSource} = require('./functions/base');
  return getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource);
}

async function getAccountInfo(accountAddr) {
  const {getAccountInfo} = require('./functions/base');
  return getAccountInfo(accountAddr);
}
/**
 *
 *@deprecated
 */


const AlgodexApi = {
  /**
     * @deprecated
     * @returns {void}
     */
  doAlert: deprecate(doAlert),
  /**
     * @deprecated
     * @returns {void}
     */
  getConstants: deprecate(getConstants),
  /**
     * @deprecated
     * @param promises
     * @returns {promises}
     */
  allSettled: deprecate(allSettled),

  /**
     * @deprecated
     * @param environment
     * @returns {void}
     */

  initSmartContracts: deprecate(initSmartContracts),

  /**
     * @deprecated
     * @param isAlgoEscrowApp
     * @returns {number}
     */

  getOrderBookId: deprecate(getOrderBookId),

  /**
     * @deprecated
     * @param accountInfo
     * @param includesFullAccountInfo
     * @returns {number}
     */

  getMinWalletBalance: deprecate(getMinWalletBalance),

  // Options are: local, test, production

  /**
     * @deprecated
     * @param environment
     * @returns {indexerClient}
     */
  initIndexer: deprecate(initIndexer),
  /**
     * @deprecated
     * @param environment
     * @returns {algodClient}
     */
  // local, test, production
  initAlgodClient: deprecate(initAlgodClient),
  /**
     * @deprecated
     * @param txId
     * @returns {object}
     */
  // Wait for a transaction to be confirmed
  waitForConfirmation: deprecate(waitForConfirmation),

  /**
     * @deprecated
     * @param x
     * @returns {function}
     */

  dumpVar: deprecate(dumpVar),

  /**
     * @deprecated
     * @param limitPrice
     * @returns {object}
     */

  getNumeratorAndDenominatorFromPrice: deprecate(getNumeratorAndDenominatorFromPrice),

  /**
     * @deprecated
     * @param blockChainOrderVal
     * @param price
     * @param n
     * @param d
     * @param min
     * @param escrowAddr
     * @param algoBalance
     * @param asaBalance
     * @param escrowOrderType
     * @param isASAEscrow
     * @param orderCreatorAddr
     * @param assetId
     * @param version
     * @returns {indexerClient}
     */

  createOrderBookEntryObj: deprecate(createOrderBookEntryObj),

  /**
     * @deprecated
     * @param queuedOrder
     * @returns {object}
     */

  getCutOrderTimes: deprecate(getCutOrderTimes),

  /**
     * @deprecated
     * @param algodClient
     * @param isSellingASA
     * @param assetId
     * @param userWalletAddr
     * @param limitPrice
     * @param orderAssetAmount
     * @param orderAlgoAmount
     * @param allOrderBookOrders
     * @param includeMaker
     * @param walletconnector
     * @returns {object}
     */

  executeOrder: deprecate(executeOrder),


  /**
     * @deprecated
     * @param algodClient
     * @param escrowAccountAddr
     * @param cresatorAddr
     * @param orderBookEntry
     * @param version
     *  @returns {object}
     */


  closeOrderFromOrderBookEntry: deprecate(closeOrderFromOrderBookEntry),
  /**
     * @deprecated

     * @param txns
     *  @returns {void}
     */
  assignGroups: deprecate(assignGroups),

  /**
     * @deprecated
     * @param algoAmount
     * @param asaAmount
     * @param limitPrice
     * @param isSellingAsa
     *  @returns {void}
     */

  finalPriceCheck: deprecate(finalPriceCheck),

  /**
     * @deprecated
     * @param txnList
     *  @returns {array}
     */

  getAlgoandAsaAmounts: deprecate(getAlgoandAsaAmounts),

  /**
     * @deprecated
     * @param algodClient
     * @param outerTxns
     * @param params
     * @param walletConnector
     *  @returns {array}
     */

  signAndSendWalletConnectTransactions: deprecate(signAndSendWalletConnectTransactions),

  /**
     * @deprecated
     * @param algodClient
     * @param outerTxns
     *  @returns {array}
     */

  signAndSendTransactions: deprecate(signAndSendTransactions),
  /**
     * @deprecated
     * @param makerWalletAddr
     * @param n
     * @param d
     * @param min
     * @param assetId
     * @param includeMakerAddr
     *  @returns {string}
     */
  generateOrder: deprecate(generateOrder),

  /**
     * @deprecated
     * @param algodClient
     * @param makerWalletAddr
     * @param n
     * @param d
     * @param min
     * @param assetId
     * @param algoOrderSize,
     * @param signAndSend
     * @param walletConnector
     *  @returns {object}
     */

  getPlaceAlgosToBuyASAOrderIntoOrderbook: deprecate(getPlaceAlgosToBuyASAOrderIntoOrderbook),

  // /**
  //    * @deprecated
  //    * @param algodClient
  //    * @param makerWalletAddr
  //    * @param n
  //    * @param d
  //    * @param min
  //    * @param assetId
  //    * @param algoOrderSize,
  //    * @param signAndSend
  //    * @param walletConnector
  //    *  @returns {object}
  //    */

  // getPlaceAlgosToBuyASAOrderIntoOrderbook: deprecate(getPlaceAlgosToBuyASAOrderIntoOrderbook, {file: './lib/functions/AlgodexApi'}),

  /**
     * @deprecated
     * @param algodClient
     * @param isSellingAsa
     * @param assetId
     * @param userWalletAddr,
     * @param limitPrice
     * @param orderAssetAmount
     * @param orderAlgoAmount
     * @param allOrderBookOrders
     * @param includeMaker
     * @param walletConnector
     *  @returns {object}
     */

  executeMarketOrder: deprecate(executeMarketOrder),

  /**
     * @deprecated
     * @param algodClient
     * @param makerWalletAddr
     * @param n
     * @param d
     * @param min
     * @param assetId
     * @param algoOrderSize,
     * @param signAndSend
     * @param walletConnector
     *  @returns {string}
     */

  getPlaceASAToSellASAOrderIntoOrderbook: deprecate(getPlaceASAToSellASAOrderIntoOrderbook),

  // ///////////////////////////////
  // INTERNAL PASS-THRU FUNCTIONS /
  // ///////////////////////////////
  /**
     * @deprecated
     * @param signedTxns
     *  @returns {string}
     */
  printTransactionDebug: deprecate(printTransactionDebug),
  /**
     * @deprecated
     * @param min
     * @param assetId
     * @param N
     * @param D
     * @param writerAddr
     * @param isASAEscrow
     * @param version
     *  @returns {string}
     */
  buildDelegateTemplateFromArgs: deprecate(buildDelegateTemplateFromArgs),
  /**
     * @deprecated
     * @param algosdk
     * @param algodClient
     * @param program
     * @param logProgramSource
     *  @returns {string}
     */
  getLsigFromProgramSource: deprecate(getLsigFromProgramSource),
  /**
     * @deprecated
     * @param accountAddr
     *  @returns {object}
     */
  getAccountInfo: deprecate(getAccountInfo),


};

module.exports = AlgodexApi;


