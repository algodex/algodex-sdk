/* eslint-disable no-mixed-spaces-and-tabs */
const {
	getPlaceASAToSellASAOrderIntoOrderbook,
	getPlaceAlgosToBuyASAOrderIntoOrderbook,
	getNumeratorAndDenominatorFromPrice,
} = require('../../functions/base');

const withPlaceAlgoOrderTxns = require('./withPlaceAlgoOrderTxns')

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
async function withComposeTakerTxnsWithMaker(compileObj, takerOrderBalance, limitPrice, isSellingASA) {
	const { allTransList, currentOrderValues } = compileObj.takerTransObject;
	let { lastExecutedPrice, groupNum, txOrderNum } = currentOrderValues;
	let makerTxns;


	// const numAndDenom = lastExecutedPrice !== -1 ?
	// 		getNumeratorAndDenominatorFromPrice(lastExecutedPrice) :
	// 		getNumeratorAndDenominatorFromPrice(limitPrice);
	//one complication is that potential cut n and d are not included in the takerOrderBalance logic, need to brainstorm
	const leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
	const leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
	console.debug('includeMaker is true');
	if (isSellingASA && leftoverASABalance > 0) {
		console.debug('leftover ASA balance is: ' + leftoverASABalance);

		makerTxns = await getPlaceASAToSellASAOrderIntoOrderbook(
			compileObj.algodClient,
			takerOrderBalance.takerAddr,
			compileObj.contract.n,
			compileObj.contract.d,
			0,
			takerOrderBalance.assetId,
			leftoverASABalance,
			false,
		);
	} else if (!isSellingASA && leftoverAlgoBalance > 0) {
		console.debug('leftover Algo balance is: ' + leftoverASABalance);
		makerTxns = await withPlaceAlgoOrderTxns(compileObj)

		// makerTxns = await getPlaceAlgosToBuyASAOrderIntoOrderbook(
		//   compileObj.algodClient,
		//   takerOrderBalance.takerAddr,
		//   compileObj.contract.n,
		//   compileObj.contract.d,
		//   0,
		//   takerOrderBalance.assetId,
		//   leftoverAlgoBalance,
		//   false,
		// );
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

	compileObj.contract.txns = allTransList
	return compileObj
}

module.exports = withComposeTakerTxnsWithMaker;
