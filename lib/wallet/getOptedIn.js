/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const AlgodError = require('../error/AlgodError');
const logger = require('../logger');

/**
 *
 * @param {algosdk.Indexer} indexer
 * @param {Object} accountInfo
 * @param {string} assetId
 * @return {Promise<boolean>}
 */
async function getOptedIn(indexer, accountInfo, assetId) {
  if (!(indexer instanceof algosdk.Indexer)) {
    throw new AlgodError('Must have a valid SDK Indexer');
  }

  if (typeof assetId !== 'number') {
    throw new TypeError('Must have valid AssetId');
  }

  //   if ( typeof accountInfo !== 'object') {
  //     throw new TypeError('Must have valid Account Info!');
  //   }
  let _optIn = false;

  if (typeof accountInfo?.assets === 'undefined') {
    logger.warn({address: accountInfo.address}, 'Loading account info!');
    accountInfo = await indexer.lookupAccountByID(accountInfo.address).do();
  }

  if (typeof accountInfo !== 'undefined' && typeof accountInfo.assets !== 'undefined' &&
        accountInfo['assets'].length > 0) {
    _optIn = accountInfo.assets.map((asset) => asset['asset-id']).includes(assetId);
  }
  return _optIn;
}

module.exports = getOptedIn;
