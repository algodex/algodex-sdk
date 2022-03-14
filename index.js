/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate')
//import algodex from './algodex_api.js';
const algodex = require('./algodex_api.js');
const OrderService = require('./lib/functions/order.js');
const WalletService = require('./lib/functions/wallet.js')
const algoOrderBook = require('./dex_teal.js');
const asaOrderBook = require('./asa_dex_teal.js');
const constants = require('./lib/constants.js');
const signingApi = require('./lib/functions/signing_api.js');

/**
 * Alert function test
 * @deprecated
 */
exports.doAlert = algodex.doAlert

/**
 * @deprecated
 * @returns {{escrowContractVersion: number, orderBookContractVersion: number}}
 */
exports.getSmartContractVersions = function getSmartContractVersions() {
	return {
		'escrowContractVersion': constants.ESCROW_CONTRACT_VERSION,
		'orderBookContractVersion': constants.ORDERBOOK_CONTRACT_VERSION
	};
};

/**
 * @deprecated
 * @type {(function(): string)|*}
 */
exports.getAsaOrderBookTeal = asaOrderBook.getASAOrderBookApprovalProgram;
/**
 * @deprecated
 * @type {(function(): string)|*}
 */
exports.getAlgoOrderBookTeal = algoOrderBook.getAlgoOrderBookApprovalProgram;
/**
 * @deprecated
 * @type {(function(*): number)|*}
 */
exports.getOrderBookId = algodex.getOrderBookId;

/**
 * Print console message test
 * @deprecated
 */
exports.printMsg = function() {
	console.log("Hello World from algodex-sdk!!!");
	return "Hello World from algodex-sdk!!!";
};

/**
 * @deprecated
 * @type {(function(): ({LOCAL_ALGOD_SERVER, PUBLIC_TEST_INDEXER_PORT: string, TEST_ASA_ORDERBOOK_APPID: number, PROD_ALGOD_SERVER: string, PUBLIC_TEST_ALGOD_SERVER: string, PUBLIC_TEST_BACKEND_API: string, PUBLIC_TEST_INDEXER_TOKEN: string, TEST_INDEXER_PORT: string, TEST_ALGOD_TOKEN: string, TEST_INDEXER_TOKEN: string, PROD_ALGO_ORDERBOOK_APPID: number, PROD_INDEXER_PORT: string, TEST_ALGOD_SERVER: string, LOCAL_ALGOD_TOKEN, MIN_ASA_ESCROW_BALANCE: number, PUBLIC_TEST_ASA_ORDERBOOK_APPID: number, TEST_INDEXER_SERVER: string, LOCAL_ASA_ORDERBOOK_APPID: number, PROD_BACKEND_API: string, TEST_BACKEND_API: string, PUBLIC_TEST_INDEXER_SERVER: string, TEST_ALGO_ORDERBOOK_APPID: number, LOCAL_INDEXER_SERVER: string, PROD_INDEXER_TOKEN: string, LOCAL_ALGO_ORDERBOOK_APPID: number, LOCAL_BACKEND_API: string, PROD_ALGOD_TOKEN: string, LOCAL_ALGOD_PORT, LOCAL_INDEXER_TOKEN: string, DEBUG: number, PROD_ALGOD_PORT: string, MIN_ESCROW_BALANCE: number, PROD_INDEXER_SERVER: string, ESCROW_CONTRACT_VERSION: number, DEBUG_SMART_CONTRACT_SOURCE: number, TEST_ALGOD_PORT: string, PUBLIC_TEST_ALGOD_TOKEN: string, PROD_ASA_ORDERBOOK_APPID: number, LOCAL_INDEXER_PORT: string, PUBLIC_TEST_ALGOD_PORT: string, INFO_SERVER: string, PUBLIC_TEST_ALGO_ORDERBOOK_APPID: number, ORDERBOOK_CONTRACT_VERSION: number}|{DEBUG?: number, DEBUG_SMART_CONTRACT_SOURCE?: number, INFO_SERVER?: string, ESCROW_CONTRACT_VERSION?: number, ORDERBOOK_CONTRACT_VERSION?: number, MIN_ESCROW_BALANCE?: number, MIN_ASA_ESCROW_BALANCE?: number, LOCAL_ALGOD_SERVER?: string, LOCAL_ALGOD_PORT?: string, LOCAL_ALGOD_TOKEN?: string, LOCAL_BACKEND_API?: string, LOCAL_INDEXER_SERVER?: string, LOCAL_INDEXER_PORT?: string, LOCAL_INDEXER_TOKEN?: string, LOCAL_ALGO_ORDERBOOK_APPID?: number, LOCAL_ASA_ORDERBOOK_APPID?: number, TEST_ALGOD_SERVER?: (string|undefined), TEST_ALGOD_PORT?: (string|undefined), TEST_ALGOD_TOKEN?: (string|undefined), TEST_BACKEND_API?: string, TEST_INDEXER_SERVER?: string, TEST_INDEXER_PORT?: string, TEST_INDEXER_TOKEN?: string, TEST_ALGO_ORDERBOOK_APPID?: number, TEST_ASA_ORDERBOOK_APPID?: number, PUBLIC_TEST_ALGOD_SERVER?: (string|undefined), PUBLIC_TEST_ALGOD_PORT?: (string|undefined), PUBLIC_TEST_ALGOD_TOKEN?: (string|undefined), PUBLIC_TEST_BACKEND_API?: string, PUBLIC_TEST_INDEXER_SERVER?: string, PUBLIC_TEST_INDEXER_PORT?: string, PUBLIC_TEST_INDEXER_TOKEN?: string, PUBLIC_TEST_ALGO_ORDERBOOK_APPID?: number, PUBLIC_TEST_ASA_ORDERBOOK_APPID?: number, PROD_ALGOD_SERVER?: (string|undefined), PROD_ALGOD_PORT?: (string|undefined), PROD_ALGOD_TOKEN?: (string|undefined), PROD_BACKEND_API?: string, PROD_INDEXER_SERVER?: string, PROD_INDEXER_PORT?: string, PROD_INDEXER_TOKEN?: string, PROD_ALGO_ORDERBOOK_APPID?: number, PROD_ASA_ORDERBOOK_APPID?: number}))|*}
 */
exports.getConstants = algodex.getConstants;

/**
 * @deprecated
 * @type {AlgodexApi.initSmartContracts}
 */
exports.initSmartContracts = algodex.initSmartContracts;
/**
 * @deprecated
 * @type {(function(String): *)|*}
 */
exports.initIndexer = algodex.initIndexer;
/**
 * @deprecated
 * @type {(function(String): *)|*}
 */
exports.initAlgodClient = algodex.initAlgodClient;

/**
 * @deprecated
 * @type {{setClient({client: *, [p: string]: *}): void, getAllEscrowOrders: function(*): *, placeOrder({order: Object, orders?: Object, config?: Object}): Promise<*[]|undefined>, placeOrderOriginal(*, *, *, *=): (Promise<*>|Promise<*|undefined>|Promise<*[]|*>), constructor({config: *}): void, closeOrder: function(*, String, String, String, int): Promise<void>, getOrders()}}
 */
exports.OrderService = OrderService;

/**
 * @deprecated
 * @type {function(*): void}
 */
exports.WalletService = WalletService;

/**
 * @deprecated
 * @type {(function(*): Promise<{statusMsg: string, txId: *, transaction: *, status: string}|{statusMsg: string, txId: *, transaction: *, status: string}|undefined>)|*}
 */
exports.waitForConfirmation = algodex.waitForConfirmation;

/**
 * @deprecated
 * @type {(function(*, *=): Promise<number>)|*}
 */
exports.getMinWalletBalance = algodex.getMinWalletBalance;

/**
 * @deprecated
 * @type {(function(*): Promise<*|{amount: number, address: *, 'apps-local-state': [], 'apps-total-schema': {'num-uint': number, 'num-byte-slice': number}, 'created-assets': [], 'pending-rewards': number, 'reward-base': number, 'created-apps': [], assets: [], round: number, 'amount-without-pending-rewards': number, rewards: number, status: string}|null|undefined>)|*}
 */
exports.getAccountInfo = algodex.getAccountInfo;

/**
 * @deprecated
 * @type {(function(*): void)|*}
 */
exports.printTransactionDebug = algodex.printTransactionDebug;

/**
 * @deprecated
 * @type {(function(Number): {d: number, n: number})|*}
 */
exports.getNumeratorAndDenominatorFromPrice = algodex.getNumeratorAndDenominatorFromPrice;

/**
 * @deprecated
 * @type {(function(String, Number, Number, Number, Number, String, Number, Number, String, Boolean, String, Number, Number=): *)|*}
 */
exports.createOrderBookEntryObj = algodex.createOrderBookEntryObj;


/**
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
 * @returns {Object} Promise for when the batched transaction(s) are fully
 * @deprecated
 */
exports.executeOrderAsTaker = async function executeOrderAsTaker(algodClient, isSellingASA_AsTakerOrder, assetId,
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector) {

	const { params, allTransList } = await algodex.structureOrder(algodClient, isSellingASA_AsTakerOrder, assetId,
		takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);


	if (!!walletConnector && walletConnector.connector.connected) {
		const signedGroupTransactions = await signingApi.signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
		const confirmedWalletConnectArr = await signingApi.propogateTransactions(algodClient, signedGroupTransactions);
		return confirmedWalletConnectArr;
	} else {
		const singedGroupedTransactions = await signingApi.signMyAlgoTransactions(allTransList);
		const confirmedMyAlgoWalletArr = await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
		return confirmedMyAlgoWalletArr;
	}
	// return algodex.executeOrder(algodClient, isSellingASA_AsTakerOrder, assetId,
    //     takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);

};

/**
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
 * @deprecated
 */

exports.executeMarketOrderAsTaker = async function executeMarketOrderAsTaker(algodClient, isSellingASA_AsTakerOrder, assetId,
	takerWalletAddr, currentMarketPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector, tolerance=.20) {

	const worstAcceptablePrice = isSellingASA_AsTakerOrder ? currentMarketPrice * (1 - tolerance) : currentMarketPrice * (1 + tolerance);

	const {params, allTransList} = await algodex.structureOrder(algodClient, isSellingASA_AsTakerOrder, assetId,
        takerWalletAddr, worstAcceptablePrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);

	if(!!walletConnector && walletConnector.connector.connected) {
		const signedGroupTransactions = await signingApi.signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
		const confirmedWalletConnectArr = await signingApi.propogateTransactions(algodClient,signedGroupTransactions) ;
		return confirmedWalletConnectArr;
	  } else {
		  const singedGroupedTransactions = await signingApi.signMyAlgo(algodClient, allTransList );
		  const confirmedMyAlgoWalletArr = await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
		  return confirmedMyAlgoWalletArr;
	  }


	// return algodex.executeMarketOrder(algodClient, isSellingASA_AsTakerOrder, assetId,
	// 	takerWalletAddr, worstAcceptablePrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);

};



/**
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
 * @deprecated
 */
exports.executeOrderAsMakerAndTaker = async function executeOrderAsMakerAndTaker(algodClient, isSellingASA, assetId,
        userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector) {

	const {params, allTransList} = await algodex.structureOrder(algodClient, isSellingASA, assetId,
        userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, true, walletConnector);

	if (!!walletConnector && walletConnector.connector.connected) {
		const signedGroupTransactions = await signingApi.signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
		const confirmedWalletConnectArr = await signingApi.propogateTransactions(algodClient, signedGroupTransactions);
		return confirmedWalletConnectArr;
	} else {
		const singedGroupedTransactions = await signingApi.signMyAlgo(algodClient, allTransList);
		const confirmedMyAlgoWalletArr = await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
		return confirmedMyAlgoWalletArr;
	}

	// return algodex.executeOrder(algodClient, isSellingASA, assetId,
    //     userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, true, walletConnector);


};

/**
 * @deprecated
 * @todo: Alert Users to import from '@algodex/algodex-sdk/functions'
 * @type {(function(Object, String, String, Object, int, *): Promise<void>)|*}
 */
exports.closeOrderFromOrderBookEntry = algodex.closeOrderFromOrderBookEntry;

/**
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
 * @deprecated
 */

exports.placeAlgosToBuyASAOrderIntoOrderbook = function placeAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, walletConnector) {
	return algodex.getPlaceAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, true, walletConnector);
};

/**
 * Maker order to create a new algo-only escrow account and order book entry
 * Note: use getNumeratorAndDenominatorFromPrice() to get the n and d values.
 *
 * @param {String} makerWalletAddr: external wallet address of the user placing the order. Used to sign with My Algo
 * @param {Number}               n: numerator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
 * @param {Number}               d: denominator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
 * @param {Number}             min: minimum execution amount size. Should always be set to 0 (for the time being).
 * @param {Number}         assetId: Algorand ASA ID for the asset.
 * @returns {Object} Promise for when the transaction is fully confirmed
 * @deprecated
 */
exports.placeASAToSellASAOrderIntoOrderbook = function placeASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, walletConnector) {
	return algodex.getPlaceASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, true, walletConnector);
};


////////////////////////////////////
// DEVELOPMENT PASS-THRU FUNCTIONS /
////////////////////////////////////
/**
 * @deprecated
 * @param min
 * @param assetid
 * @param N
 * @param D
 * @param writerAddr
 * @param isASAEscrow
 * @param version
 * @returns {*|null}
 */
exports.buildDelegateTemplateFromArgs = function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version) {
	return algodex.buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version);
};

/**
 * @deprecated
 * @param algosdk
 * @param algodClient
 * @param program
 * @param logProgramSource
 * @returns {Promise<*>}
 */
exports.getLsigFromProgramSource = function getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource) {
	return algodex.getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource);
};
/**
 * @deprecated
 * @param x
 * @returns {string}
 */
exports.dumpVar = function dumpVar(x) {
	return algodex.dumpVar(x);
}

/**
 * Export of deprecated functions
 */
Object.keys(exports).forEach((key)=>{
	exports[key] = deprecate(exports[key], {context: exports, throws: true, file:'index.js'})
})
