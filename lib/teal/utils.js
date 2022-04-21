const algosdk = require('algosdk');
const logger = require('../logger');
const txns = require('./txns');
const {default: axios} = require('axios');

/**
 * @deprecated
 * @type {string}
 */
const ALGOD_SERVER='http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com';
/**
 * @deprecated
 * @type {string}
 */
const ALGOD_TOKEN = '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259'; // { 'X-API-Key': 'VELyABA1dGqGbAVktbew4oACvp0c0298gMgYtYIb' }
/**
 * @deprecated
 * @type {string}
 */
const ALGOD_PORT='8080';

/**
 * @param {string} addr
 * @return {Promise<any>}
 * @deprecated
 */
async function getAccountInfo(addr) {
  try {
    const port = (ALGOD_PORT) ? ':' + ALGOD_PORT : '';
    const response = await axios.get(
        ALGOD_SERVER + port + '/v2/accounts/'+addr,
        {headers: {'X-Algo-API-Token': ALGOD_TOKEN}},
    );
    return response.data;
  } catch (error) {
    logger.error(error);
    throw new Error('getAccountInfo failed: ', error);
  }
}

/**
 * Send Groups Transactions
 *
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {Object<Uint8Array>} groupsOfTransactions Transactions Keyed by Group
 * @return {Promise<void>}
 */
async function sendGroupsTransactions(client, groupsOfTransactions) {
  // terrible practice but fine for the time being.
  for (const group in groupsOfTransactions) {
    if (group !== 'prototype') {
      const {txId} = await client.sendRawTransaction(groupsOfTransactions[group]).do();
      await algosdk.waitForConfirmation(client, txId, 10);
    }
  }
}


/**
 * Check Pending
 *
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {string} txId Transaction ID
 * @return {Promise<PendingTransactionInformation>}
 */
async function checkPending(client, txId) {
  const pendingInfo = await client.pendingTransactionInformation(txId).do();
  if (pendingInfo != null && pendingInfo.txn != null && pendingInfo.txn.txn != null) {
    return pendingInfo;
  } else {
    console.log('Looping');
    return checkPending(client, txId);
  }
}

/**
 * Deprecated Wait For Confirmation
 * @deprecated
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {string} txId Transaction ID
 * @return {Promise<PendingTransactionInformation>}
 */
async function waitForConfirmation(client, txId) {
  const status = (await client.status().do());
  let lastRound = status['last-round'];
  const pendingInfo = await client.pendingTransactionInformation().do();
  if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
    // Got the completed Transaction
    logger.debug('Transaction ' + txId + ' confirmed in round ' + pendingInfo['confirmed-round']);
    return pendingInfo;
  } else {
    lastRound++;
    await client.statusAfterBlock(lastRound).do();
    return waitForConfirmation(client, txId);
  }
}
/**
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {Uint8Array | Uint8Array[]} stxOrStxs
 * @return {Promise<void>}
 */
async function sendAndCheckConfirmed(client, stxOrStxs) {
  const sendRawTxn = await client.sendRawTransaction(stxOrStxs).do();
  await waitForConfirmation(client, sendRawTxn.txId);
}
/**
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {Uint8Array | Uint8Array[]} stxOrStxs
 * @return {Promise<void>}
 */
async function sendAndCheckPending(client, stxOrStxs) {
  const sendRawTxn = await client.sendRawTransaction(stxOrStxs).do();
  await checkPending(client, sendRawTxn.txId);
}

/**
 * Delete Application
 *
 * @param {algosdk.Algodv2} client  Algorand Client
 * @param {algosdk.Account} sender Algorand Sender
 * @param {string|number} appId  Application ID
 * @return {Promise<void>}
 */
async function deleteApplication(client, sender, appId) {
  // create unsigned transaction
  const params = await client.getTransactionParams().do();
  const txn = algosdk.makeApplicationDeleteTxn(sender.addr, params, appId);

  // sign, send, await
  const signedTxn = txn.signTxn(sender.sk);
  const txId = txn.txID().toString();

  logger.debug('Signed transaction with txID: %s', txId);
  // Submit the transaction
  try {
    await client.sendRawTransaction(signedTxn).do();
  } catch (e) {
    logger.error({e});
  }
  // display results
  await client.pendingTransactionInformation(txId).do();
  logger.debug('Deleted app-id: ', appId);
}
/**
 * Close Account
 * @param {algosdk.Algodv2} client
 * @param {algosdk.Account} fromAccount
 * @param {algosdk.Account} toAccount
 * @return {Promise<void>}
 */
async function closeAccount(client, fromAccount, toAccount) {
  logger.debug('teal.closeAccount - checking account info for: ' + fromAccount.addr);
  const fromAccountInfo = await getAccountInfo(fromAccount.addr);
  if (fromAccountInfo != null && fromAccountInfo['assets'] != null &&
    fromAccountInfo['assets'].length > 0) {
    for (let i = 0; i < fromAccountInfo['assets'].length; i++) {
      const asset = fromAccountInfo['assets'][i];
      const assetId = asset['asset-id'];
      logger.info('closing asset: ' + assetId + ' for account: ' + fromAccount.addr);
      const txn = await txns.makeAssetTransferTxn(client, fromAccount, toAccount, 0, assetId, undefined, true);
      const signedTxn = algosdk.signTransaction(txn, fromAccount.sk);
      await sendAndCheckPending(client, [signedTxn.blob]);
    }
  }

  const fundTxn = await txns.makePaymentTxn(client, fromAccount, toAccount, 0, true);
  const fundTxnId = fundTxn.txID().toString();
  const signedTxn = fundTxn.signTxn(fromAccount.sk);
  logger.info('Signed transaction with txID: %s', fundTxnId);
  // Submit the transaction
  try {
    await client.sendRawTransaction(signedTxn).do();
  } catch (e) {
    logger.error({e});
  }
  await checkPending(client, fundTxnId);
}

/**
 * @param {algosdk.Algodv2} client
 * @param {algosdk.Account} fromAccount
 * @param {algosdk.Account} toAccount
 * @param {number} amount
 * @return {Promise<void>}
 */
async function transferFunds(client, fromAccount, toAccount, amount) {
  const fundTxn = await txns.makePaymentTxn(
      client, fromAccount, toAccount, amount, false,
  );
  const fundTxnId = fundTxn.txID().toString();

  const signedFundTxn = fundTxn.signTxn(fromAccount.sk);
  logger.debug('Signed transaction with txID: %s', fundTxnId);

  // Submit the transaction
  try {
    await client.sendRawTransaction(signedFundTxn).do();
  } catch (e) {
    logger.debug(JSON.stringify(e));
  }

  // Wait for confirmation
  await checkPending(client, fundTxnId);
}

/**
 * @param accountAddr
 * @param assetId
 * @return {Promise<null|*>}
 */
async function getAssetBalance(accountAddr, assetId) {
  logger.debug('checking account info for: ' + accountAddr);
  const accountInfo = await getAccountInfo(accountAddr);
  if (accountInfo != null && accountInfo['assets'] != null &&
    accountInfo['assets'].length > 0) {
    for (let i = 0; i < accountInfo['assets'].length; i++) {
      const asset = accountInfo['assets'][i];
      logger.debug({asset} );
      if (asset['asset-id'] === assetId) {
        return asset['amount'];
      }
    }
  }
  return null;
}

/**
 * @param {Array<Object>} outerTxns
 * @return {Array}
 */
function groupAndSignTransactions(outerTxns) {
  logger.info('inside signAndSend transactions');
  const _txns = [];

  for (let i = 0; i < outerTxns.length; i++) {
    _txns.push(outerTxns[i].unsignedTxn);
  }

  const groupID = algosdk.computeGroupID(_txns);
  for (let i = 0; i < _txns.length; i++) {
    _txns[i].group = groupID;
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
  logger.debug('printing transaction debug');
  // algodex.printTransactionDebug(signed);

  return signed;
}

/**
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {algosdk.Account} fromAccount
 * @param {algosdk.Account} toAccount
 * @param {number} amount
 * @param {string|number} assetId
 * @return {Promise<void>}
 */
async function transferASA(
    client,
    fromAccount,
    toAccount,
    amount,
    assetId,
) {
  const asaTransferTxn = await txns.makeAssetTransferTxn(client, fromAccount, toAccount, amount, assetId, false);
  const asaTxnId = asaTransferTxn.txID().toString();

  const signedFundTxn = asaTransferTxn.signTxn(fromAccount.sk);
  logger.debug('Signed transaction with txID: %s', asaTxnId);

  // Submit the transaction
  try {
    await client.sendRawTransaction(signedFundTxn).do();
  } catch (e) {
    logger.error(e);
  }

  // Wait for confirmation
  await checkPending(client, asaTxnId);
}
module.exports = {
  sendGroupsTransactions,
  deleteApplication,
  closeAccount,
  getAssetBalance,
  getAccountInfo,
  transferFunds,
  checkPending,
  transferASA,
  sendAndCheckConfirmed,
  sendAndCheckPending,
  waitForConfirmation,
  groupAndSignTransactions,
};
