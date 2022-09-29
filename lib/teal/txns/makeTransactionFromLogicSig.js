/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const getTransactionParams = require('../getTransactionParams');

/**
 * Transaction Factory from LogicSigAccount
 *
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {"appNoOp"|"appOptIn"} txnType Type of Transaction
 * @param {algosdk.LogicSigAccount} lsig Logic Signature Account
 * @param {algosdk.SuggestedParams} suggestedParams Suggested Parameters
 * @param {number} appIndex the ID of the app to use
 * @param {Array<Uint8Array>} [appArgs] Array of Uint8Array, any additional arguments to the application
 * @return {Promise<Transaction>}
 * @ignore
 */
async function makeTransactionFromLogicSig(
    client,
    txnType,
    lsig,
    suggestedParams,
    appIndex,
    appArgs,
) {
  /**
   * Types of Transactions
   * @type {Object}
   * @private
   */
  const _txnTypes = {'appNoOp': algosdk.makeApplicationNoOpTxn, 'appOptIn': algosdk.makeApplicationOptInTxn};

  if (typeof txnType !== 'string' || !Object.keys(_txnTypes).includes(txnType)) {
    throw new TypeError(`Invalid transaction type! Must be one of: ${Object.keys(_txnTypes)}`);
  }

  if (!(lsig instanceof algosdk.LogicSigAccount)) {
    throw new TypeError('Must be valid LogicSigAccount');
  }


  /**
   * Lsig Account Address
   * @type {string}
   * @private
   */
  const _from = lsig.address();

  /**
   * Suggested Parameters
   * @type {algosdk.SuggestedParams}
   * @private
   */
  const _suggestedParams = await getTransactionParams(client, suggestedParams, true);

  /**
   * Application Transaction
   * @type {Transaction}
   */
  return _txnTypes[txnType](
      _from,
      _suggestedParams,
      appIndex,
      appArgs,
  );
}
module.exports = makeTransactionFromLogicSig;
