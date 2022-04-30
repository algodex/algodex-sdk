const logger = require('../../logger');
const makePaymentTxn = require('../txns/makePaymentTxn');
const makeTransactionFromLogicSig = require('../txns/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('../txns/makeAssetTransferTxn');
const {makeApplicationCloseOutTxn, makeApplicationNoOpTxn} = require('algosdk');
const makeTakerAlgoTxns = require('../txns/makeTakerAlgoTxns');
const { txns } = require('../../teal');


async function structureCutAlgoTakerTxns(order) {
	
	const {
		address,
		cutTakerOrder:{
    address:takerAddr,
    escrowCreator,
    asaAmountSending,
    algoAmountReceiving,
    price,
    asset: {
      id: assetId,
    },
    appId,
    shouldClose,
    entry: orderBookEntry,
    program,
    lsig,}
	} = order;

	return await makeTakerAlgoTxns({
		...order, 
		contract: {
			...order.contract, 
			amountSending: asaAmountSending,
			amountReceiving: algoAmountReceiving,
			lsig: lsig,
			creator: escrowCreator
		}

	}) 
}

module.exports = structureCutAlgoTakerTxns;
