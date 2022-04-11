/* eslint-disable max-len */

/**
 * ## ✉ withGetWalletAssetAmount
 * Validates and returns assetWalletAmount associated
 * with an account
 *
 * @param {Account} accountInfo Algorand Account
 * @param {Number} assetId Standard ASA assetId
 * @return {Number} walletAlgoAmount
 * @memberOf module:order/structures
 */
function withGetWalletAssetAmount(accountInfo, assetId) {
  const emptyAccount = accountInfo === null && accountInfo['assets'] === null && accountInfo['assets'].length <= 0;
  if (emptyAccount) return 0;

  const matchingAssetArr = accountInfo['assets'].filter((asset) => asset["asset-id"] === assetId);


  if (matchingAssetArr.length > 0) {
    return matchingAssetArr.pop().amount;
  } else {
    return 0; // returning 0 if empty account or account does not have assetBalance
  }
}


module.exports = withGetWalletAssetAmount;

