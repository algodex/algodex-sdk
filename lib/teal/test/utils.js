/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const logger = require('../../logger');


const {sendAndCheckConfirmed, groupAndSignTransactions} = require('../utils');

/**
 *
 * @param {Array} outerTxns
 */
function printOuterTransactions(outerTxns) {
  for (let i = 0; i < outerTxns.length; i++ ) {
    logger.log(outerTxns[i]);
  }
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

const blankProgramSource = `#pragma version 4
int 1
return`;

/**
 * @todo instanceOf Errors
 * @param {Object} config
 * @param {algosdk.Algodv2} client
 * @param {Array} outerTxns
 * @param {Object} negTestTxnConfig
 * @return {Promise<boolean>}
 */
async function runNegativeTest(config, client, outerTxns, negTestTxnConfig) {
  logger.log('STARTING runNegativeTest');
  logger.log({negTestTxnConfig});

  const {txnNum, field, val, negTxn, innerNum, configKeyForVal, txnKeyForVal, txnNumForVal} = negTestTxnConfig;
  const txn = outerTxns[txnNum];

  const getVal = () => {
    if (configKeyForVal !== undefined) {
      logger.log({configKeyForVal, config});
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
  logger.log({txn});

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
 *
 * @return {algosdk.Account}
 */
function getOpenAccount() {
  // WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI
  const mn = 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above';
  return algosdk.mnemonicToSecretKey(mn);
}


/**
 *
 * @return {algosdk.Account}
 */
function getExecuteAccount() {
  // UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A
  const mn = 'three satisfy build purse lens another idle fashion base equal echo recall proof hill shadow coach early palm act wealth dawn menu portion above mystery';
  return algosdk.mnemonicToSecretKey(mn);
}
/**
 *
 * @return {algosdk.Account}
 * @deprecated
 */
function getRandomAccount() {
  return algosdk.generateAccount();
}
module.exports = {
  blankProgramSource,
  getExecuteAccount,
  getOpenAccount,
  getRandomAccount,
  runNegativeTest,
  printOuterTransactions,
};
