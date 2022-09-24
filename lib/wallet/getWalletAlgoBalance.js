/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * ## ✉ withCheckWalletAlgoBalance
 * Validates and returns algoWalletAmount associated
 * with an account
 *
 * @param {Account} accountInfo Algorand Account
 * @param {Number} minBalance Minimum balance
 * @return {Boolean} whether algoAmount meets the requirement
 */
function getWalletAlgoBalance(accountInfo, minBalance= 0) {
  if (accountInfo.amount === undefined) throw new Error('Invalid Acct Object: Missing amount property');

  if (typeof minBalance !== 'number') throw new TypeError('Invalid Type: minBalance is not a number');

  const walletAlgoAmount = accountInfo['amount'] - minBalance - (0.004 * 1000000);

  if (walletAlgoAmount <= minBalance) throw new Error('Insufficient Balance');
  return walletAlgoAmount;
}

module.exports = getWalletAlgoBalance;
