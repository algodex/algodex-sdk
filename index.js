/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////


//import algodex from './algodex_api.js';
const algodex = require('./algodex_api.js');
const algoOrderBook = require('./dex_teal.js');
const asaOrderBook = require('./asa_dex_teal.js');

/*
 * Alert function test
 */
exports.doAlert = function() {
	algodex.doAlert();
};

exports.getAsaOrderBookTeal = function() {
	return asaOrderBook.getASAOrderBookApprovalProgram();
};

exports.getAlgoOrderBookTeal = function() {
	return algoOrderBook.getAlgoOrderBookApprovalProgram();
};

/*
 * Print console message test
 */ 
exports.printMsg = function() {
	console.log("Hello World from algodex-sdk!!!");
	return "Hello World from algodex-sdk!!!";
};

exports.getConstants = function() {
	return algodex.getConstants();
}


/*
 * Initialize smart contract environments. This is also called from within
 * initIndexer() and initAlgodClient
 *
 * @param {String} environment Must be "local", "test", or "production".
 */
exports.initSmartContracts = function(environment) {
	return algodex.initSmartContracts(environment);
};

/*
 * Initialize and return indexer client.
 *
 * @param {String} environment Must be "local", "test", or "production".
 */
exports.initIndexer = function(environment) {
	return algodex.initIndexer(environment);
};

/*
 * Initialize and return indexer client.
 *
 * @param {String} environment: Must be "local", "test", or "production".
 */
exports.initAlgodClient = function(environment) {
	return algodex.initAlgodClient(environment);
};

/*
 * Check pending transactions
 *
 * @param {Object}     algodClient: object that has been initialized via initAlgodClient()
 * @param {String}            txid: transaction ID
 * @param {Number} numRoundTimeout: block id to have the timeout for if the transaction isn't complete
 * @returns Promise for when the transaction is in the pending queue
 */
exports.checkPending = function(algodClient, txid, numRoundTimeout) {
	return algodex.checkPending(algodClient, txid, numRoundTimeout);
};

/*
 * Wait for a transaction to be confirmed into the blockchain
 * @param   {Object} algodClient: object which has been initialized via initAlgodClient()
 * @param   {String}        txId: transaction ID
 * @returns {Object} Promise for when the transaction is complete
 */
exports.waitForConfirmation = function(algodClient, txId) {
	return algodex.waitForConfirmation(algodClient, txId);
};

/*
 * @param   {String} accountAddr: Account Address to get account info from.
 * @returns {Object} account information
 */
exports.getAccountInfo = function(accountAddr) {
	return algodex.getAccountInfo(accountAddr);
};

/*
 * Prints out base64 for transactions for use in debugging with algod and tealdbg
 *
 * @param   {Uint8Array[]} signedTxns: array of Uint8Array structures that contain signed transactions
 * @returns {String} base64 encoded transactions
 */
exports.printTransactionDebug = function(signedTxns) {
	return algodex.printTransactionDebug(signedTxns);
};

/*
 * Converts a limitPrice to N and D values which are used to store the price in the 
 * blockchain, since decimals can't be used for calculations in smart contracts.
 *
 * @param   {Number} limitPrice: price of the base unit ASA in terms of microALGO
 * @returns {Object} contains N and D number values for usage in the smart contracts
 */
exports.getNumeratorAndDenominatorFromPrice = function(limitPrice) {
	return algodex.getNumeratorAndDenominatorFromPrice(limitPrice);
};


/*
 * Creates an order entry from parameters, which represents an existing entry in the order book
 * The data should mirror what's already on the blockchain. 
 *
 * @param {String} blockChainOrderVal: order entry that matches what's on the blockchain. For example "2500-625-0-15322902" (N-D-min-assetId)
 * @param {Number} price             : Decimal value. Calculated using d/n.
 * @param {Number} n                 : numerator of the price ratio. Must be an integer.
 * @param {Number} d                 : denominator of the price ratio. Must be an integer. 
 * @param {Number} min               : minimum order size
 * @param {String} escrowAddr        : address of escrow account. Needed for closing orders
 * @param {Number} algoBalance       : amount of algos stored inside of the escrow
 * @param {Number} asaBalance        : amount of ASAs stored inside of the escrow
 * @param {String} escrowOrderType   : "buy" or "sell"
 * @param {Boolean} isASAEscrow      : true or false. True if the escrow account is set up to hold (and sell) ASAs
 * @param {String} orderCreatorAddr  : address of the owner of the escrow, i.e. the wallet that created the order. Not the escrow address
 * @param {Number} assetId           : id of the asset
 */
exports.createOrderBookEntryObj = function(blockChainOrderVal, price, n, d, min, escrowAddr, algoAmount, asaAmount,
                                           escrowOrderType, isASAEscrow, orderCreatorAddr, assetId) {
	return algodex.createOrderBookEntryObj(blockChainOrderVal, price, n, d, min, escrowAddr, algoAmount, asaAmount,
                                           escrowOrderType, isASAEscrow, orderCreatorAddr, assetId);
};


/*
 * Executes a limit order as a taker and submits it to the blockchain
 *
 * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
 * @param {Boolean} isSellingASA_AsTakerOrder: boolean true if the taker is selling the ASA to an ALGO-only escrow buy order
 * @param {Number}                    assetId: Algorand ASA ID for the asset.
 * @param {String}            takerWalletAddr: public address of the taker's wallet address
 * @param {Number}                 limitPrice: price of the base unit ASA in terms of microALGO
 * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
 * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
 * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
 * @returns {Object} Promise for when the batched transaction(s) are fully confirmed
 */
exports.executeOrderAsTaker = function(algodClient, isSellingASA_AsTakerOrder, assetId, 
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders) {

	return algodex.executeOrderAsTaker(algodClient, isSellingASA_AsTakerOrder, assetId, 
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders);

};

/*
 * Closes an existing order and refunds the escrow account to the owner
 *
 * @param {Object}       algodClient: object that has been initialized via initAlgodClient()
 * @param {String} escrowAccountAddr: public address of the escrow account
 * @param {String}       creatorAddr: public address of the owner of the escrow account
 * @param {Object}    orderBookEntry: blockchain order book string. For example "2500-625-0-15322902" (N-D-min-assetId)
 * @returns {Object} Promise for when the transaction is fully confirmed
 */
exports.closeOrderFromOrderBookEntry = function(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry) {
	return algodex.closeOrderFromOrderBookEntry(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry);
};

/*
 * Maker order to create a new algo-only escrow account and order book entry
 * Note: use getNumeratorAndDenominatorFromPrice() to get the n and d values.
 *
 * @param {Object}     algodClient: object that has been initialized via initAlgodClient()
 * @param {String} makerWalletAddr: external wallet address of the user placing the order. Used to sign with My Algo
 * @param {Number}               n: numerator   of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
 * @param {Number}               d: denominator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
 * @param {Number}         assetId: Algorand ASA ID for the asset.
 * @param {Number}   algoOrderSize: size of the order in terms of algos
 * @returns {Object} Promise for when the transaction is fully confirmed
 */

exports.placeAlgosToBuyASAOrderIntoOrderbook = function(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize) {
	return algodex.placeAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize);
};

/*
 * Maker order to create a new algo-only escrow account and order book entry
 * Note: use getNumeratorAndDenominatorFromPrice() to get the n and d values.
 *
 * @param {String} makerWalletAddr: external wallet address of the user placing the order. Used to sign with My Algo
 * @param {Number}               n: numerator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
 * @param {Number}               d: denominator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
 * @param {Number}             min: minimum execution amount size. Should always be set to 0 (for the time being).
 * @param {Number}         assetId: Algorand ASA ID for the asset.
 * @returns {Object} Promise for when the transaction is fully confirmed
 */
exports.placeASAToSellASAOrderIntoOrderbook = function(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount) {
	return algodex.placeASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount);
};


////////////////////////////////////
// DEVELOPMENT PASS-THRU FUNCTIONS /
////////////////////////////////////
exports.buildDelegateTemplateFromArgs = function(min, assetid, N, D, writerAddr, isASAEscrow) {
	return algodex.buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow);
};

exports.getLsigFromProgramSource = function(algosdk, algodClient, program, logProgramSource) {
	return algodex.getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource);
};

exports.dumpVar = function(x) {
	return algodex.dumpVar(x);
}

