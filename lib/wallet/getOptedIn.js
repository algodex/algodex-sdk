const algosdk = require('algosdk');
const AlgodError = require('../error/AlgodError');
const logger = require('../logger');

async function getOptedIn(client, accountInfo, assetId) {
  if (!(client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Must have a valid SDK client');
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
    accountInfo = await client.accountInformation(accountInfo.address).do();
  }

  if (typeof accountInfo !== 'undefined' && typeof accountInfo.assets !== 'undefined' &&
        accountInfo['assets'].length > 0) {
    _optIn = accountInfo.assets.map((asset) => asset['asset-id']).includes(assetId);
  }
  return _optIn;
}

module.exports = getOptedIn;
