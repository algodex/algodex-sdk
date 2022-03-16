
const http = require('http');
const algosdk = require('algosdk');
const {formatJsonRpcRequest} = require('@json-rpc-tools/utils');
const BigN = require('js-big-decimal');

const LESS_THAN = -1;
const EQUAL = 0;
const GREATER_THAN = 1;

let MyAlgo = null;
let myAlgoWalletUtil = null;
if (typeof window != 'undefined') {
  MyAlgo = require('@randlabs/myalgo-connect');
  myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
}
if (process.env.NODE_ENV === 'test') {
  myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
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


/**
     *
     * @param txId
     * @returns {Promise<{statusMsg: string, txId, transaction: (*|((storeNames: (string | Iterable<string>), mode?: IDBTransactionMode) => IDBTransaction)|((callback: (transaction: SQLTransactionSync) => void) => void)|((storeNames: (string | string[]), mode?: IDBTransactionMode) => IDBTransaction)|IDBTransaction|((callback: (transaction: SQLTransaction) => void, errorCallback?: (error: SQLError) => void, successCallback?: () => void) => void)), status: string}>}
     */
async function waitForConfirmation(txId) {
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
      response = await axios.get(ALGOD_INDEXER_SERVER + port +
                        '/v2/transactions/' + txId, {headers: {'X-Algo-API-Token': ALGOD_INDEXER_TOKEN}});
    } catch (e) {
      isError = true;
    }
    if (response == null || response.data == null || response.data.transaction == null) {
      isError = true;
    }

    if (!isError) {
      const txnInfo = response.data.transaction;

      if (txnInfo['confirmed-round'] !== null && txnInfo['confirmed-round'] > 0) {
        // Got the completed Transaction
        console.debug(`Transaction ${txId} confirmed in round ${txnInfo['confirmed-round']}`);
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
     * Get Account Information
     * @param   {String}  accountAddr          Account Address to get account info from.
     * @param   {Boolean} returnEmptyAccount   Flag to return empty
     * @returns {Object}                       account information
     */

async function getAccountInfo(accountAddr, returnEmptyAccount=true) {
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
                    '/v2/accounts/'+accountAddr, {headers: {'X-Algo-API-Token': ALGOD_INDEXER_TOKEN}});
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

function allSettled(promises) {
  const wrappedPromises = promises.map((p) => Promise.resolve(p)
      .then(
          (val) => ({status: 'promiseFulfilled', value: val}),
          (err) => ({status: 'promiseRejected', reason: err})));
  return Promise.all(wrappedPromises);
}


module.exports = {
  waitForConfirmation: waitForConfirmation,
  getAccountInfo: getAccountInfo,
  allSettled: allSettled,

};
