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
const constants = require('./constants.js');

/*
 * Alert function test
 */
exports.doAlert = function() {
	algodex.doAlert();
};

exports.getSmartContractVersions = function() {
	return {
		'escrowContractVersion': constants.ESCROW_CONTRACT_VERSION,
		'orderBookContractVersion': constants.ORDERBOOK_CONTRACT_VERSION
	};
};

exports.getAsaOrderBookTeal = function() {
	return asaOrderBook.getASAOrderBookApprovalProgram();
};

exports.getAlgoOrderBookTeal = function() {
	return algoOrderBook.getAlgoOrderBookApprovalProgram();
};

exports.getOrderBookId = function(isAlgoEscrowApp) {
	return algodex.getOrderBookId(isAlgoEscrowApp);
}
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
 * Wait for a transaction to be confirmed into the blockchain
 * @param   {String} txId: transaction ID
 * @returns {Object} Promise for when the transaction is complete
 */
exports.waitForConfirmation = function(txId) {
	return algodex.waitForConfirmation(txId);
};

/*
 * Wait for a transaction to be confirmed into the blockchain
 * @param   {Object}  accountInfo: account information object
 * @returns {int} Min balance is returned.
 */
exports.getMinWalletBalance = function(accountInfo) {
	return algodex.getMinWalletBalance(accountInfo);
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
 * @param {Number} version           : version of the escrow contract
 */
exports.createOrderBookEntryObj = function(blockChainOrderVal, price, n, d, min, escrowAddr, algoAmount, asaAmount,
                                           escrowOrderType, isASAEscrow, orderCreatorAddr, assetId, version) {
	return algodex.createOrderBookEntryObj(blockChainOrderVal, price, n, d, min, escrowAddr, algoAmount, asaAmount,
                                           escrowOrderType, isASAEscrow, orderCreatorAddr, assetId, version);
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
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector) {
	return algodex.executeOrder(algodClient, isSellingASA_AsTakerOrder, assetId, 
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);

};

/*
 * Executes a market order as a taker and submits it to the blockchain
 *
 * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
 * @param {Boolean} isSellingASA_AsTakerOrder: boolean true if the taker is selling the ASA to an ALGO-only escrow buy order
 * @param {Number}                    assetId: Algorand ASA ID for the asset.
 * @param {String}            takerWalletAddr: public address of the taker's wallet address
 * @param {Number}                 currentMarketPrice: market price of the base unit ASA in terms of microALGO
 * @param {Number}                 worstAcceptablePrice: price of the base unit ASA in terms of microALGO after accounting for tolerance
 * @param {Number}                 tolerance: float from 0-1
 * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
 * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
 * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
 * @returns {Object} Promise for when the batched transaction(s) are fully confirmed
 */

exports.executeMarketOrderAsTaker = function(algodClient, isSellingASA_AsTakerOrder, assetId, 
	takerWalletAddr, currentMarketPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector, tolerance=.20) {
		
	const worstAcceptablePrice = isSellingASA_AsTakerOrder ? currentMarketPrice * (1 - tolerance) : currentMarketPrice * (1 + tolerance);

	return algodex.executeMarketOrder(algodClient, isSellingASA_AsTakerOrder, assetId, 
		takerWalletAddr, worstAcceptablePrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);

};



/*
 * Executes a limit order as a maker and taker and submits it to the blockchain
 *
 * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
 * @param {Boolean}              isSellingASA: boolean true if the user is selling the ASA
 * @param {Number}                    assetId: Algorand ASA ID for the asset.
 * @param {String}            userWalletAddr: public address of the taker/maker's wallet address
 * @param {Number}                 limitPrice: price of the base unit ASA in terms of microALGO
 * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
 * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
 * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
 * @returns {Object} Promise for when the batched transaction(s) are fully confirmed
 */
exports.executeOrderAsMakerAndTaker = function(algodClient, isSellingASA, assetId, 
        userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector) {

	return algodex.executeOrder(algodClient, isSellingASA, assetId, 
        userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, true, walletConnector);

};

/*
 * Closes an existing order and refunds the escrow account to the owner
 *
 * @param {Object}       algodClient: object that has been initialized via initAlgodClient()
 * @param {String} escrowAccountAddr: public address of the escrow account
 * @param {String}       creatorAddr: public address of the owner of the escrow account
 * @param {Object}    orderBookEntry: blockchain order book string. For example "2500-625-0-15322902" (N-D-min-assetId)
 * @param {int}       version:        escrow version as an int.
 * @returns {Object} Promise for when the transaction is fully confirmed
 */
exports.closeOrderFromOrderBookEntry = function(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry, version, walletConnector) {
	return algodex.closeOrderFromOrderBookEntry(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry, version, walletConnector);
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

exports.placeAlgosToBuyASAOrderIntoOrderbook = function(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, walletConnector) {
	return algodex.getPlaceAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, true, walletConnector);
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
exports.placeASAToSellASAOrderIntoOrderbook = function(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, walletConnector) {
	return algodex.getPlaceASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, true, walletConnector);
};


////////////////////////////////////
// DEVELOPMENT PASS-THRU FUNCTIONS /
////////////////////////////////////
exports.buildDelegateTemplateFromArgs = function(min, assetid, N, D, writerAddr, isASAEscrow, version) {
	return algodex.buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version);
};

exports.getLsigFromProgramSource = function(algosdk, algodClient, program, logProgramSource) {
	return algodex.getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource);
};

exports.dumpVar = function(x) {
	return algodex.dumpVar(x);
}

