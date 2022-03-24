// ///////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
// ///////////////////////////

const algosdk = require('algosdk');
const axios = require('axios').default;
const deprecate = require('../lib/functions/deprecate');
const fns = require('../lib/functions/base.js');
const algodex = {
  ...fns,
  ...fns.default,
};
const constants = require('../lib/constants.js');
const transactionGenerator = require('../generate_transaction_types.js');

const ALGOD_SERVER='https://testnet.algoexplorerapi.io';
const ALGOD_TOKEN = ''; // { 'X-API-Key': 'VELyABA1dGqGbAVktbew4oACvp0c0298gMgYtYIb' }
const ALGOD_PORT='';

/**
 * Use single name for method
 * @deprecated
 * @return {AlgodClient}
 */
function getLocalClientAndEnv() {
  // const algodClient = algodex.initAlgodClient("test");
  const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
  return algodClient;
}

/**
 *
 * @return {Account}
 */
function getRandomAccount() {
  return algosdk.generateAccount();
}
/**
 * @param {string} addr
 * @return {Promise<any>}
 */
async function getAccountInfo(addr) {
  // return algodex.getAccountInfo(addr);

  // This is the old account info that uses algod, not the indexer
  // This is necessary for the tests to go faster as the indexer takes time to update.

  try {
    const port = (ALGOD_PORT) ? ':' + ALGOD_PORT : '';

    const response = await axios.get(ALGOD_SERVER + port + '/v2/accounts/'+addr, {headers: {'X-Algo-API-Token': ALGOD_TOKEN}});
    // console.debug(response);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error('getAccountInfo failed: ', error);
  }
}

/**
 *
 * @param {Algodv2} client
 * @param {Account} fromAccount
 * @param {Account} toAccount
 * @return {Promise<void>}
 */
async function closeAccount(client, fromAccount, toAccount) {
  console.log('checking account info for: ' + fromAccount.addr);
  const fromAccountInfo = await getAccountInfo(fromAccount.addr);
  if (fromAccountInfo != null && fromAccountInfo['assets'] != null &&
        fromAccountInfo['assets'].length > 0) {
    for (let i = 0; i < fromAccountInfo['assets'].length; i++) {
      const asset = fromAccountInfo['assets'][i];
      const assetId = asset['asset-id'];
      console.log('closing asset: ' + assetId + ' for account: ' + fromAccount.addr);
      const txn = await transactionGenerator.getAssetSendTxn(client, fromAccount, toAccount, 0, assetId, true);
      const signedTxn = algosdk.signTransaction(txn, fromAccount.sk);
      await sendAndCheckPending(client, [signedTxn.blob]);
    }
  }

  const fundTxn = await transactionGenerator.getPayTxn(client, fromAccount, toAccount, 0, true);
  const fundTxnId = fundTxn.txID().toString();
  const signedTxn = fundTxn.signTxn(fromAccount.sk);
  console.log('Signed transaction with txID: %s', fundTxnId);
  // Submit the transaction
  try {
    await client.sendRawTransaction(signedTxn).do();
  } catch (e) {
    console.log({e});
  }
  await checkPending(client, fundTxnId);
}

/**
 *
 * @return {Account}
 */
function getOpenAccount() {
  // WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI
  const mn = 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above';
  return algosdk.mnemonicToSecretKey(mn);
}

/**
 *
 * @param {Algodv2} client
 * @param {Account} sender
 * @param {string|number} appId
 * @return {Promise<void>}
 */
async function deleteApplication(client, sender, appId) {
  // create unsigned transaction
  const params = await client.getTransactionParams().do();
  const txn = algosdk.makeApplicationDeleteTxn(sender.addr, params, appId);

  // sign, send, await
  const signedTxn = txn.signTxn(sender.sk);
  const txId = txn.txID().toString();

  console.log('Signed transaction with txID: %s', txId);
  // Submit the transaction
  try {
    await client.sendRawTransaction(signedTxn).do();
  } catch (e) {
    console.log({e});
  }
  // display results
  await client.pendingTransactionInformation(txId).do();
  console.log('Deleted app-id: ', appId);
}

/**
 *
 * @return {Account}
 */
function getExecuteAccount() {
  // UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A
  const mn = 'three satisfy build purse lens another idle fashion base equal echo recall proof hill shadow coach early palm act wealth dawn menu portion above mystery';
  return algosdk.mnemonicToSecretKey(mn);
}

/**
 *
 * @param {Algodv2} algodClient
 * @param {string} txId
 * @return {Promise<void>}
 */
async function waitForConfirmation(algodClient, txId) {
  const status = (await algodClient.status().do());
  let lastRound = status['last-round'];
  while (true) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      // Got the completed Transaction
      console.log('Transaction ' + txId + ' confirmed in round ' + pendingInfo['confirmed-round']);
      break;
    }
    lastRound++;
    await algodClient.statusAfterBlock(lastRound).do();
  }
}

/**
 *
 * @param {Algodv2} algodClient
 * @param {string} txId
 * @return {Promise<void>}
 */
async function checkPending(algodClient, txId) {
  while (true) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    if (pendingInfo != null && pendingInfo.txn != null && pendingInfo.txn.txn != null) {
      break;
    }
  }
}

/**
 *
 * @param outerTxns
 */
function printOuterTransactions(outerTxns) {
  for (let i = 0; i < outerTxns.length; i++ ) {
    console.log(outerTxns[i]);
  }
}
/**
 * @param client
 * @param fromAccount
 * @param toAccount
 * @param amount
 * @param assetId
 * @return {Promise<void>}
 */
async function transferASA(client, fromAccount, toAccount, amount, assetId) {
  const asaTransferTxn = await transactionGenerator.getAssetSendTxn(client, fromAccount, toAccount, amount, assetId, false);
  const asaTxnId = asaTransferTxn.txID().toString();

  const signedFundTxn = asaTransferTxn.signTxn(fromAccount.sk);
  console.log('Signed transaction with txID: %s', asaTxnId);

  // Submit the transaction
  try {
    await client.sendRawTransaction(signedFundTxn).do();
  } catch (e) {
    console.log(JSON.stringify(e));
  }

  // Wait for confirmation
  await checkPending(client, asaTxnId);
}
/**
 * @todo Use instanceOf
 * @deprecated
 * @param {Error} error
 * @return {boolean}
 * @private
 */
function _checkFailureType(error) {
  let hasKnownError = false;

  if (
    error != null &&
    error.response &&
    error.response.body &&
    error.response.body.message != null
  ) {
    const msg = error.response.body.message;
    if (msg.includes('rejected by logic err=assert failed')) {
      hasKnownError = true;
    } else if (msg.includes('TEAL runtime encountered err opcode')) {
      hasKnownError = true;
    } else if (
      msg.includes('rejected by logic err=gtxn lookup TxnGroup') &&
      msg.includes('but it only has')
    ) {
      hasKnownError = true;
    } else if (msg.includes('logic eval error: assert failed')) {
      hasKnownError = true;
    } else {
      throw new Error('Unknown error type: ' + msg);
    }
  }

  return hasKnownError;
}

/**
 * @param client
 * @param fromAccount
 * @param toAccount
 * @param amount
 * @return {Promise<void>}
 */
async function transferFunds(client, fromAccount, toAccount, amount) {
  const fundTxn = await transactionGenerator.getPayTxn(
      client, fromAccount, toAccount, amount, false,
  );
  const fundTxnId = fundTxn.txID().toString();

  const signedFundTxn = fundTxn.signTxn(fromAccount.sk);
  console.log('Signed transaction with txID: %s', fundTxnId);

  // Submit the transaction
  try {
    await client.sendRawTransaction(signedFundTxn).do();
  } catch (e) {
    console.log(JSON.stringify(e));
  }

  // Wait for confirmation
  await checkPending(client, fundTxnId);
}

/**
 * @param client
 * @param signedTxns
 * @return {Promise<void>}
 */
async function sendAndCheckConfirmed(client, signedTxns) {
  // Submit the transaction
  let txId = null;
  try {
    const sentTxns = await client.sendRawTransaction(signedTxns).do();
    txId = sentTxns.txId;
  } catch (e) {
    throw e;
  }
  // Wait for confirmation
  await waitForConfirmation(client, txId);
}
/**
 * @param client
 * @param signedTxns
 * @return {Promise<void>}
 */
async function sendAndCheckPending(client, signedTxns) {
  // Submit the transaction
  let txId = null;
  try {
    const sentTxns = await client.sendRawTransaction(signedTxns).do();
    txId = sentTxns.txId;
  } catch (e) {
    throw e;
  }
  // Wait for confirmation
  await checkPending(client, txId);
}

/**
 * Note: this function is currently not used and has not been run before.
 * @param algodClient
 * @param makerAccount
 * @param price
 * @param assetId
 * @param isASAEscrow
 * @return {Promise<*>}
 */
async function getOrderLsig(algodClient, makerAccount,
    price, assetId, isASAEscrow) {
  const orderCreatorAddr = makerAccount.addr;
  const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  const n = numAndDenom.n;
  const d = numAndDenom.d;

  const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, isASAEscrow, constants.ESCROW_CONTRACT_VERSION);
  return await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
}

/**
 * @param accountAddr
 * @param assetId
 * @return {Promise<null|*>}
 */
async function getAssetBalance(accountAddr, assetId) {
  console.log('checking account info for: ' + accountAddr);
  const accountInfo = await getAccountInfo(accountAddr);
  if (accountInfo != null && accountInfo['assets'] != null &&
    accountInfo['assets'].length > 0) {
    for (let i = 0; i < accountInfo['assets'].length; i++) {
      const asset = accountInfo['assets'][i];
      console.log({asset} );
      if (asset['asset-id'] == assetId) {
        return asset['amount'];
      }
    }
  }
  return null;
}

/**
 * @todo instanceOf Errors
 * @param config
 * @param client
 * @param outerTxns
 * @param negTestTxnConfig
 * @return {Promise<boolean>}
 */
async function runNegativeTest(config, client, outerTxns, negTestTxnConfig) {
  console.log('STARTING runNegativeTest');
  console.log({negTestTxnConfig});

  const {txnNum, field, val, negTxn, innerNum, configKeyForVal, txnKeyForVal, txnNumForVal} = negTestTxnConfig;
  const txn = outerTxns[txnNum];

  const getVal = () => {
    if (configKeyForVal !== undefined) {
      console.log({configKeyForVal, config});
      return config[configKeyForVal];
    }
    if (txnKeyForVal !== undefined) {
      return outerTxns[txnNumForVal].unsignedTxn[txnKeyForVal];
    }
    return val;
  };

  if (!negTxn) {
    if (innerNum === undefined) {
      outerTxns[txnNum].unsignedTxn[field] = getVal();
      if (txnKeyForVal === 'from' && field === 'from') {
        delete outerTxns[txnNum].lsig;
        delete outerTxns[txnNum].senderAcct;

        if (outerTxns[txnNumForVal].lsig !== undefined) {
          outerTxns[txnNum].lsig = outerTxns[txnNumForVal].lsig;
        }
        if (outerTxns[txnNumForVal].senderAcct !== undefined) {
          outerTxns[txnNum].senderAcct = outerTxns[txnNumForVal].senderAcct;
        }
      }
    } else {
      outerTxns[txnNum].unsignedTxn[field][innerNum] = getVal();
    }
  } else {
    outerTxns[txnNum] = negTxn;
  }
  // const t = outerTxns[0];
  console.log({txn});

  const signedTxns = groupAndSignTransactions(outerTxns);

  try {
    await sendAndCheckConfirmed(client, signedTxns);
  } catch (e) {
    // An exception is expected. Return true for success
    // TODO: Use instanceOf
    return _checkFailureType(e);
  }

  return false;
}
/**
 * @param {Array<Object>} outerTxns
 * @return {Array}
 */
function groupAndSignTransactions(outerTxns) {
  console.log('inside signAndSend transactions');
  const txns = [];

  for (let i = 0; i < outerTxns.length; i++) {
    txns.push(outerTxns[i].unsignedTxn);
  }

  const groupID = algosdk.computeGroupID(txns);
  for (let i = 0; i < txns.length; i++) {
    txns[i].group = groupID;
  }

  for (let i = 0; i < outerTxns.length; i++) {
    const txn = outerTxns[i];
    if (txn.lsig != null) {
      const signedLsig = algosdk.signLogicSigTransactionObject(txn.unsignedTxn, txn.lsig);
      txn.signedTxn = signedLsig.blob;
    } else {
      const signedTxn = algosdk.signTransaction(txn.unsignedTxn, txn.senderAcct.sk);
      txn.signedTxn = signedTxn.blob;
    }
  }

  const signed = [];

  for (let i = 0; i < outerTxns.length; i++) {
    signed.push(outerTxns[i].signedTxn);
  }
  console.log('printing transaction debug');
  algodex.printTransactionDebug(signed);

  return signed;
}
// ---------------------------- EXPORTS---------------------------------------------
module.exports = {
  /**
     * Use single name for method
     * @deprecated
     * @returns {AlgodClient}
     */
  getLocalClient: deprecate(getLocalClientAndEnv, {file: module.filename}),
  /**
     * Use single name for method
     * @deprecated
     */
  getLocalClientAndEnv: deprecate(getLocalClientAndEnv),
  getRandomAccount,
  getAccountInfo,
  getOpenAccount,
  closeAccount,
  deleteApplication,
  getExecuteAccount,
  waitForConfirmation,
  checkPending,
  printOuterTransactions,
  checkFailureType: deprecate(_checkFailureType, {file: module.filename}),
  transferASA,
  transferFunds,
  sendAndCheckConfirmed,
  sendAndCheckPending,
  getOrderLsig,
  getAssetBalance,
  runNegativeTest,
  groupAndSignTransactions,
};
