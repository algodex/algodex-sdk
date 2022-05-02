const logger = require('../../logger');


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
  const takerMissingProps = !(Object.prototype.hasOwnProperty.call(takerOrderBalance, 'walletAlgoBalance') &&
  Object.prototype.hasOwnProperty.call(takerOrderBalance, 'asaBalance') &&
  Object.prototype.hasOwnProperty.call(takerOrderBalance, 'algoBalance') &&
  Object.prototype.hasOwnProperty.call(takerOrderBalance, 'limitPrice')
  );


  if (takerMissingProps) {
    throw new Error('invalid orderBalance object');
  }


  if (isSellingASA && parseFloat(takerOrderBalance['asaBalance']) <= 0) {
    console.debug('breaking due to 0 asaBalance balance!');

    return false;
  }
  if (!isSellingASA && parseFloat(takerOrderBalance['algoBalance']) <= 0) {
    console.debug('breaking due to 0 algoBalance balance!');
    return false;
  }

	if (isSellingASA && takerOrderBalance['limitPrice'] > price) {
    console.debug('breaking because queuedOrder price is lower than taker sellPrice');

    return false;
  }
  if (!isSellingASA && parseFloat(takerOrderBalance['limitPrice']) < price) {
    console.debug('breaking because queuedOrder price is higher than taker buy price');
    return false;
  }


  return true;
}

module.exports = withContinueStructureLoopCheck;

