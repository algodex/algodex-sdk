/* eslint-disable max-len */

/**
 * ## ✉ withDetermineFinaleOrderAndWalletAmounts
 * Validates and returns assetWalletAmount associated
 * with an account
 *
 * @param {Object} walletAndOrderAmountObj Object Of Order And Wallet amounts
 * @param {Boolean} isSellingASA determines whether buy or sell
 * @return {Object} Object containing final algo and asset amounts
 * @memberOf module:order/structures
 */
function withDetermineFinalOrderAndWalletAmounts(walletAndOrderAmountObj, isSellingASA) {
  let {orderAssetAmount, orderAlgoAmount, walletAlgoAmount, walletAssetAmount} = walletAndOrderAmountObj;
  orderAssetAmount = Math.max(1, orderAssetAmount);
  orderAlgoAmount = Math.max(1, orderAlgoAmount);

  if (isSellingASA) {
    // we are selling an ASA so check wallet balance
    return {
      orderAlgoBalance: walletAlgoAmount,
      orderAssetBalance: Math.min(orderAssetAmount, walletAssetAmount),
    };
  } else {
    // wallet ASA balance doesn't matter since we are selling algos
    return {
      orderAlgoBalance: Math.min(orderAlgoAmount, walletAlgoAmount),
      orderAssetBalance: walletAssetAmount,
    };
  }
}


module.exports = withDetermineFinalOrderAndWalletAmounts;


