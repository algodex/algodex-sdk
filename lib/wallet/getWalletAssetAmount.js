/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* eslint-disable max-len */

/**
 * ## ✉ getWalletAssetAmount
 * Validates and returns assetWalletAmount associated
 * with an account
 *
 * @param {Account} accountInfo Algorand Account
 * @param {Number} assetId Standard ASA assetId
 * @return {Number} walletAlgoAmount
 */
function getWalletAssetAmount(accountInfo, assetId) {
  const emptyAccount = accountInfo === null? true : false;
  // const emptyAccount = accountInfo === null && accountInfo['assets'] === null && accountInfo['assets'].length <= 0;
  // the above conditional does not make any sense, if accountInfo is null then there are no properties on it... Talk to Michael
  // about changing
  if (emptyAccount) return 0;

  const takerMissingProps = !(Object.prototype.hasOwnProperty.call(accountInfo, 'amount'));

  if (takerMissingProps) throw new Error('AccountInfo object must have amount and assets field ');


  const matchingAssetArr = accountInfo['assets'].filter((asset) => asset['asset-id'] === assetId);


  if (matchingAssetArr.length > 0) {
    return matchingAssetArr.pop().amount;
  } else {
    return 0; // returning 0 if empty account or account does not have assetBalance
  }
}


module.exports = getWalletAssetAmount;

