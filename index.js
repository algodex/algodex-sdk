
//import algodex from './algodex_api.js';
const algodex = require('./algodex_api.js');

exports.doAlert = function() {
	algodex.doAlert();
}
exports.printMsg = function() {
	console.log("Hello World from algodex-api!!!");
	return "Hello World from algodex-api!!!";
};

exports.initIndexer = function(environment) {
	return algodex.initIndexer(environment);
};

exports.initAlgodClient = function(environment) {
	return algodex.initAlgodClient(environment);
};

exports.checkPending = function(algodClient, txid, numRoundTimeout) {
	return algodex.checkPending(algodClient, txid, numRoundTimeout);
};

exports.waitForConfirmation = function(algodClient, txId) {
	return algodex.waitForConfirmation(algodClient, txId);
};

exports.getAccountInfo = function(accountAddr) {
	return algodex.getAccountInfo(accountAddr);
};

exports.printTransactionDebug = function(signedTxns) {
	return algodex.printTransactionDebug(signedTxns);
};

exports.getNumeratorAndDenominatorFromPrice = function(limitPrice) {
	return algodex.getNumeratorAndDenominatorFromPrice(limitPrice);
};

exports.executeOrderClickAsTaker = function(algodClient, isSellingASA_AsTakerOrder, assetId, 
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders) {

	return algodex.executeOrderClickAsTaker(algodClient, isSellingASA_AsTakerOrder, assetId, 
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders);

};

exports.closeOrderFromOrderBookEntry = function(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry) {
	return algodex.closeOrderFromOrderBookEntry(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry);
};

exports.placeAlgosToBuyASAOrderIntoOrderbook = function(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize) {
	return algodex.placeAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize);

};

exports.placeASAToSellASAOrderIntoOrderbook = function(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount) {
	return algodex.placeASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount);
};


/////////////////////////////////
// DEVELOPMENT PASS-THRU FUNCTIONS /
/////////////////////////////////
exports.buildDelegateTemplateFromArgs = function(min, assetid, N, D, writerAddr, isASAEscrow) {
	return algodex.buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow);
};

exports.getLsigFromProgramSource = function(algosdk, algodClient, program, logProgramSource) {
	return algodex.getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource);
};

exports.dumpVar = function(x) {
	return algodex.dumpVar(x);
}

