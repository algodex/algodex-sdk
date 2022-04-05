
const continueStructureLoopCheck = require('./withToContinueStructureLoop');
const getSplitTimesByIter = require('./withGetSplitTimesByIter');
const getRunningBalance = require('./withGetRunningBalance');
const cutQueuedOrder = require('./withCutQueuedOrder');
const structureSingleTransListWithAllTransList = require('./withStructureSingleTransListWithGroupOrder');
const { getExecuteOrderTransactionsAsTakerFromOrderEntry, getAlgoandAsaAmounts, finalPriceCheck, getExecuteAlgoOrderTxnsAsTaker, getExecuteASAOrderTxns } = require('../../functions/base');


/**
 * ## ✉ withGetStructuredTakerTxns
 * Accepts takerOrderBalance and a queuedOrders array
 * and determines the final structure of takerTxns
 * will sometimes be a batch of smaller transactions
 * whose sum is equal to the user inputted amount
 *
 * @param {Object} takerOrderBalance takerOrderBalance
 * @param {Array} queueOrders Array of queuedOrder objects
 * @param {Boolean} isSellingASA
 *
 * @return {Object} An object with array of taker transactions which as a whole represents the taker side .
 * @memberOf module:order/structures
 */
async function withGetStructuredTakerTxns(takerOrderBalance, queuedOrders, isSellingASA, compileObj) {
	let txOrderNum = 0;
	let groupNum = 0;
	const txnFee = 0.004 * 1000000; // FIXME minimum fee;
	const algodClient = takerOrderBalance.algodClient;

	const params = await algodClient.getTransactionParams().do(); // params is being supplied
	let lastExecutedPrice = -1;
	const allTransList = [];

	for (let i = 0; i < queuedOrders.length; i++) {
		if (takerOrderBalance['orderAlgoAmount'] <= txnFee) {
			// Overspending issues
			continue;
		}

		if (!continueStructureLoopCheck(
			takerOrderBalance,
			isSellingASA,
			queuedOrders[i]['price'])) {
			return;
		}


		const { cutOrder, splitTimes } = getSplitTimesByIter(queuedOrders[i], i);

		let runningBalance = getRunningBalance(queuedOrders[i]);

		let outerBreak = false;
		for (let jj = 0; jj < splitTimes; jj++) {
			if (runningBalance <= 0) {
				throw new Error('Unexpected 0 or below balance');
			}
			console.debug(
				'running balance: ' +
				runningBalance +
				' isASAEscrow: ' +
				queuedOrders[i].isASAEscrow,
			);

			const cutQueuedOrderObject = {
				queuedOrder: queuedOrders[i],
				cutOrder: cutOrder,
				splitTimes: splitTimes,
				loopIndex: jj,
				runningBalance: runningBalance,
			};

			const queuedOrder = cutQueuedOrder(cutQueuedOrderObject);

			const singleOrderTransList =
				queuedOrder.isASAEscrow ?
					getExecuteAlgoOrderTxnsAsTaker(queuedOrder, algodClient, compileObj.contract.lsig, takerOrderBalance, params) :
					await getExecuteASAOrderTxns(queuedOrder, algodClient, compileObj.contract.lsig, takerOrderBalance, params);


			// await getExecuteOrderTransactionsAsTakerFromOrderEntry(
			//     algodClient,
			//     queuedOrder,
			//     takerOrderBalance,
			//     params,
			//     // walletConnector, // getting removed
			// );
			// automate the app_args logic and then lift conditional oyt


			if (singleOrderTransList == null) {
				// Overspending issue
				outerBreak = true;
				break;
			}
			const [algo, asa] = getAlgoandAsaAmounts(singleOrderTransList);


			finalPriceCheck(algo, asa, limitPrice, isSellingASA);

			lastExecutedPrice = queuedOrder['price'];
			// Be Warned: allTransList is persisted via a side effect
			const newTxnOrderNum = structureSingleTransListWithAllTransList(
				singleOrderTransList, allTransList, txOrderNum, groupNum,
			);
			txOrderNum = newTxnOrderNum; // so next loop remembers total
			groupNum++;
			runningBalance -= cutOrder != null ? cutOrder.cutOrderAmount : 0;
		}
		if (outerBreak) {
			break;
		}
	}

	return { allTransList, currentOrderValues: { lastExecutedPrice, groupNum, txOrderNum }, params };
}

module.exports = withGetStructuredTakerTxns;


