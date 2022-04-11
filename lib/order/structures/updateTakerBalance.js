const {getExecuteASAOrderTakerTxnAmounts, getExecuteAlgoOrderTakerTxnAmounts} = require('../../functions/base')


/**
 * ## ✉ updateTakerBalance
 * takes a queued order object and taker balance object and returns the balance after 
 * the ith iteration
 * @param {Object} queuedOrder Object Of Order And Wallet amounts
 * @param {Object} takerOrderBalance Object Of Order And Wallet amounts
 * 
 * @return {Object} Object containing new takerOrderBalance
 * @memberOf module:order/structures
 */

function updateTakerBalance(queuedOrder, takerOrderBalance, isAsaEscrow) {
	if(isAsaEscrow) {
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
		takerOrderBalance['algoTradeAmount'] = algoTradeAmount
		takerOrderBalance['escrowASATradeAmount'] = escrowAsaTradeAmount
		takerOrderBalance['isExecuteASA'] = true
		
		return takerOrderBalance


	} else {
		const { algoAmountReceiving, asaAmountSending, txnFee } =
			getExecuteAlgoOrderTakerTxnAmounts(queuedOrder, takerOrderBalance);

		// if (algoAmountReceiving === 0) {
		// 	console.debug('algoAmountReceiving is 0, nothing to do, returning early');
		// 	return null;
		// }

		takerOrderBalance['algoBalance'] -= txnFee;
		takerOrderBalance['algoBalance'] += algoAmountReceiving;
		takerOrderBalance['asaBalance'] -= asaAmountSending;
		takerOrderBalance['asaAmountSending'] = asaAmountSending;
		takerOrderBalance['algoAmountReceiving'] = algoAmountReceiving;
		takerOrderBalance['isExecuteAsa'] = false

	

		return takerOrderBalance

	}
	

}

module.exports= updateTakerBalance