/* eslint-disable no-mixed-spaces-and-tabs */
const {getPlaceASAToSellASAOrderIntoOrderbook, getPlaceAlgosToBuyASAOrderIntoOrderbook, getNumeratorAndDenominatorFromPrice} = require('../../functions/base');

/**
 * ## ✉ withComposeTakerTxnsWithMaker
 * Accepts takerLeg of all translist and determines associated maker Transactions
 *
 * @param {Object} takerOrderBalance takerOrderBalance
 * @param {Array} queueOrders Array of queuedOrder objects
 * @param {Boolean} isSellingASA
 *
 * @return {Object} An object with array of taker transactions which as a whole represents the taker side .
 * @memberOf module:order/structures
 */
async function withComposeTakerTxnsWithMaker(takerTransObject, takerOrderBalance, limitPrice, isSellingASA) {
  const {allTransList, currentOrderValues} = takerTransObject;
  let {lastExecutedPrice, groupNum, txOrderNum} = currentOrderValues;
  let makerTxns;


  const numAndDenom = lastExecutedPrice !== -1 ?
			getNumeratorAndDenominatorFromPrice(lastExecutedPrice) :
			getNumeratorAndDenominatorFromPrice(limitPrice);
  const leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
  const leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
  console.debug('includeMaker is true');
  if (isSellingASA && leftoverASABalance > 0) {
		  console.debug('leftover ASA balance is: ' + leftoverASABalance);

		  makerTxns = await getPlaceASAToSellASAOrderIntoOrderbook(
			  algodClient,
			  takerOrderBalance.takerAddr,
			  numAndDenom.n,
			  numAndDenom.d,
			  0,
			  takerOrderBalance.assetId,
			  leftoverASABalance,
			  false,
			  walletConnector,
		  );
  } else if (!isSellingASA && leftoverAlgoBalance > 0) {
		  console.debug('leftover Algo balance is: ' + leftoverASABalance);

		  makerTxns = await getPlaceAlgosToBuyASAOrderIntoOrderbook(
			  algodClient,
			  takerOrderBalance.takerAddr,
			  numAndDenom.n,
			  numAndDenom.d,
			  0,
			  takerOrderBalance.assetId,
			  leftoverAlgoBalance,
			  false,
			  walletConnector,
		  );
  }


  if (makerTxns != null) {
    for (let k = 0; k < makerTxns.length; k++) {
		  const trans = makerTxns[k];
		  trans['txOrderNum'] = txOrderNum;
		  trans['groupNum'] = groupNum;
		  txOrderNum++;
		  allTransList.push(trans);

      // we are leaving the signing of lsigs to walletClients
      //   if (typeof (trans.lsig) !== 'undefined') {
      // if (!walletConnector || !walletConnector.connector.connected) {
      // 	  const signedTxn = algosdk.signLogicSigTransactionObject(
      // 		  trans.unsignedTxn,
      // 		  trans.lsig,
      // 	  );
      // 	  trans.signedTxn = signedTxn.blob;
      // }
      //   }
    	}
    groupNum++;
  }
  if (allTransList == null || allTransList.length == 0) {
    console.debug('no transactions, returning early');
	  }


	  console.debug('here 8899b signing!!');
  if (txnsForSigning == null || txnsForSigning.length == 0) {
    return;
	  }
}

module.exports= withComposeTakerTxnsWithMaker;
