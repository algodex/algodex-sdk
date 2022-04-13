/* eslint-disable max-len */

/**
 * ## ✉ withContinueStructureLoopCheck
 * Validates and returns algoWalletAmount associated
 * with an account
 *
 * @param {Account} takerOrderBalance orderBalanceObject of executor
 * @param {Boolean} isSellingASA
 * @param {Number} price
 * @return {void}
 * @memberOf module:order/structures
 */
function withContinueStructureLoopCheck(takerOrderBalance, isSellingASA, price, i) {
  const takerMissingProps= !(takerOrderBalance.hasOwnProperty('walletAlgoBalance') && // look into why it is walletALgoamount and not order AlgoAmount
    takerOrderBalance.hasOwnProperty('asaBalance') &&
    takerOrderBalance.hasOwnProperty('algoBalance') &&
    takerOrderBalance.hasOwnProperty( 'limitPrice') );
  let shouldContinue=null;

  if (takerMissingProps) {
    throw new Error('invalid orderBalance object');
  }
  if (i===0) {
    return true;
  }


  if (isSellingASA && parseFloat(takerOrderBalance['asaBalance']) <= 0) {
    console.debug('breaking due to 0 asaBalance balance!');
    shouldContinue = false;
    return shouldContinue;
  }
  if (!isSellingASA && parseFloat(takerOrderBalance['algoBalance']) <= 0) {
    console.debug('breaking due to 0 algoBalance balance!');
    shouldContinue = false;
    return shouldContinue;
  }
  if (
    isSellingASA &&
          parseFloat(takerOrderBalance['limitPrice']) > price
  ) {
    // buyer & seller prices don't match
    console.debug('continuing loop');
    shouldContinue = true;
    return shouldContinue;
  }
  if (
    !isSellingASA &&
          parseFloat(takerOrderBalance['limitPrice']) < price
  ) {
    // buyer & seller prices don't match
    console.debug('continuing loop');
    shouldContinue = true;
    return shouldContinue;
  }

  shouldContinue = true;
  return shouldContinue;
}

module.exports = withContinueStructureLoopCheck;

