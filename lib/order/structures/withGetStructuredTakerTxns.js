
const continueStructureLoopCheck = require('./withToContinueStructureLoop');
const getSplitTimesByIter = require('./withGetSplitTimesByIter');
const getRunningBalance = require('./withGetRunningBalance');
const cutQueuedOrder = require('./withCutQueuedOrder');
const structureSingleTransListWithAllTransList = require('./withStructureSingleTransListWithGroupOrder');
const structureTakerTxns = require('./withExecuteAssetOrderTxns')
const { getExecuteOrderTransactionsAsTakerFromOrderEntry, getAlgoandAsaAmounts, finalPriceCheck, getExecuteAlgoOrderTxnsAsTaker, getExecuteASAOrderTxns, getExecuteASAOrderTakerTxnAmounts  } = require('../../functions/base');
const compile = require('../compile');


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
		if (isSellingASA && parseFloat(takerOrderBalance['asaBalance']) <= 0) {
      console.debug('breaking due to 0 asaBalance balance!');
      break;
    }
    if (!isSellingASA && parseFloat(takerOrderBalance['algoBalance']) <= 0) {
      console.debug('breaking due to 0 algoBalance balance!');
      break;
    }

    if (
      isSellingASA &&
      parseFloat(takerOrderBalance['limitPrice']) > queuedOrders[i]['price']
    ) {
      // buyer & seller prices don't match
      continue;
    }
    if (
      !isSellingASA &&
      parseFloat(takerOrderBalance['limitPrice']) < queuedOrders[i]['price']
    ) {
      // buyer & seller prices don't match
      continue;
    }

		// if (!continueStructureLoopCheck(
		// 	takerOrderBalance,
		// 	isSellingASA,
		// 	queuedOrders[i]['price'], i)) {
		// 	break;
		// }


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
			const queuedOrder = Object.assign({}, queuedOrders[i]);

      if (cutOrder != null) {
        const shouldClose = (jj < cutOrder.splitTimes - 1) ? false : null;
        const useForceShouldCloseOrNot = (jj < cutOrder.splitTimes - 1);
        queuedOrder.forceShouldClose = shouldClose;
        queuedOrder.useForceShouldCloseOrNot = useForceShouldCloseOrNot;
        queuedOrder.txnNum = jj;

        if (jj >= splitTimes - 1) {
          // This is the last iteration, so simply use the running balance
          if (queuedOrder.isASAEscrow) {
            queuedOrder.asaBalance = runningBalance;
          } else {
            queuedOrder.algoBalance = runningBalance;
          }
        } else {
          if (queuedOrder.isASAEscrow) {
            queuedOrder.asaBalance = Math.min(
                cutOrder.cutOrderAmount,
                runningBalance,
            );
          } else {
            queuedOrder.algoBalance = Math.min(
                cutOrder.cutOrderAmount,
                runningBalance,
            );
          }
        }
      }

			// const cutQueuedOrderObject = {
			// 	queuedOrder: queuedOrders[i],
			// 	cutOrder: cutOrder,
			// 	splitTimes: splitTimes,
			// 	loopIndex: jj,
			// 	runningBalance: runningBalance,
			// };

			// const queuedOrder = cutQueuedOrder(cutQueuedOrderObject);
			const {
				algoTradeAmount,
				escrowAsaTradeAmount,
				executionFees,
				closeoutFromASABalance: initialCloseoutFromASABalance,
			} = getExecuteASAOrderTakerTxnAmounts(
					takerOrderBalance,
					queuedOrder,
			);

			takerOrderBalance['algoBalance'] -= executionFees;
			takerOrderBalance['algoBalance'] -= algoTradeAmount;
			takerOrderBalance['walletAlgoBalance'] -= executionFees;
			takerOrderBalance['walletAlgoBalance'] -= algoTradeAmount;
			takerOrderBalance['asaBalance'] += escrowAsaTradeAmount;
			takerOrderBalance['walletASABalance'] += escrowAsaTradeAmount;

			// const {
			// 	address: executorAccount,
			// 	escrow: makerAccount,
			// 	amount: algoAmountSending,
			// 	price,
			// 	asset: {
			// 		id: assetId,
			// 	},
			// 	appId,
			// 	shouldClose,
			// 	entry: orderBookEntry,
			// 	program,
			// 	lsig}

		

			const cutQueuedOrderComposedWithTakerInfo = {
				address: compileObj.address,
				escrow: queuedOrder.escrowAddr,
				amount: algoTradeAmount,
				price: queuedOrder.price, //want to use the price of the escrow order and not the limit price
				asset: {
					id: compileObj.asset.id
				},
				appId: compileObj.appId,
				shouldClose: queuedOrder.forceShouldClose,
				entry: queuedOrder.orderEntry,
				params: params,
				lsig: compileObj.contract.lsig,
				takerIsOptedIn: takerOrderBalance.takerIsOptedIn
			}

			const singleOrderTransList =
				!queuedOrder.isASAEscrow ?
					getExecuteAlgoOrderTxnsAsTaker(queuedOrder, algodClient, compileObj.contract.lsig, takerOrderBalance, params) :
					await structureTakerTxns(cutQueuedOrderComposedWithTakerInfo);


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

			// Taking out final price check for now because new paymentStructure does not append data found in v1 structures
			// const [algo, asa] = getAlgoandAsaAmounts(singleOrderTransList);


			// finalPriceCheck(algo, asa, takerOrderBalance.limitPrice, isSellingASA);

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


