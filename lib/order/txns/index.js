/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const makeApplicationCreateTxn = require('./makeApplicationCreateTxn');
const buyTxns = require('./buy');
const sellTxns = require('./sell');
const closeTxns = require('./close');

/**
 * # Transactions
 *
 * @namespace Transactions
 **/
module.exports = {
  ...buyTxns,
  ...sellTxns,
  ...closeTxns,
  makeApplicationCreateTxn,
};

/**
 * # Signable Transaction
 *
 * A shape for all transactions. It's main purpoes is to associate a transaction to it's signing method.
 * It either has a Logic Signature Account or needs to be signed by the end user's Wallet.
 *
 * @typedef {Object} SignableTxn
 * @property {algosdk.Transaction} unsignedTxn A unsigned Transaction
 * @property {algosdk.Account | Wallet | undefined} [senderAcct] Wallet or Algosdk Account
 * @property {algosdk.LogicSigAccount | undefined} [lsig] Logic Signature Account
 * @memberOf Transactions
 */

/**
 * # Outer Transactions
 *
 * Returned by any transaction factory in the {@link module:txns/buy} or {@link module:txns/sell} modules. These
 * structures are based on the underlying TEAL Smart Contract. You can find out more in each transaction
 * generators documentation page.
 *
 * @typedef {Transactions.SignableTxn} OuterTransactions
 * @memberOf Transactions
 */
