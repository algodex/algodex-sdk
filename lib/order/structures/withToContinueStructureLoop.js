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
function withContinueStructureLoopCheck(takerOrderBalance, isSellingASA, price) {
  const takerMissingProps= !(takerOrderBalance.hasOwnProperty('orderAlgoAmount') &&
    takerOrderBalance.hasOwnProperty('asaBalance') &&
    takerOrderBalance.hasOwnProperty('algoBalance') &&
    takerOrderBalance.hasOwnProperty( 'limitPrice') );

  if (takerMissingProps) {
    throw new Error('invalid orderBalance object');
  }


  if (isSellingASA && parseFloat(takerOrderBalance['asaBalance']) <= 0) {
    console.debug('breaking due to 0 asaBalance balance!');
    return;
  }
  if (!isSellingASA && parseFloat(takerOrderBalance['algoBalance']) <= 0) {
    console.debug('breaking due to 0 algoBalance balance!');
    return;
  }

  if (
    isSellingASA &&
          parseFloat(takerOrderBalance['limitPrice']) > price
  ) {
    // buyer & seller prices don't match
    console.debug('continuing loop');
  }
  if (
    !isSellingASA &&
          parseFloat(takerOrderBalance['limitPrice']) < price
  ) {
    // buyer & seller prices don't match
    console.debug('continuing loop');
  }
}

module.exports = withContinueStructureLoopCheck;

