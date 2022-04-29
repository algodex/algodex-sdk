const algosdk = require('algosdk');
const AlgodError = require('../error/AlgodError');

async function getOptedIn(algodClient, account, assetId){

	if (!(algodClient instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof assetId !== 'number') {
    throw new TypeError('Must have valid AssetId');
  }

  if ( typeof account !== 'string') {
    throw new TypeError('Must have valid address');
  }

  try {
    await algodClient.accountAssetInformation(account, assetId).do();
    return true;
  } catch (e) {
    return false;
    // IDK what happened to the other method I wrote but I think this would be good for checking if opted in.
    // Will do validation on parameters and then this catch statement can check the error message to ensure we get the right message
  }
};

module.exports = getOptedIn