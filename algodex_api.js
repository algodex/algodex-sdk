/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////


// const http = require('http');
const algosdk = require('algosdk');
const {formatJsonRpcRequest} = require("@json-rpc-tools/utils");
const BigN = require('js-big-decimal');
const helperFuncs = require('./helperFunctions.js');

const LESS_THAN = -1;
const EQUAL = 0;
const GREATER_THAN = 1;

/**
 * @todo Remove myalgo from sdk
 * @type {null}
 */
let MyAlgo = null;
let myAlgoWalletUtil = null;
if (typeof window != 'undefined') {
    MyAlgo = require('@randlabs/myalgo-connect');
    myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
}
if (process.env.NODE_ENV === 'test') {
    myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
    MyAlgo = function TestMyAlgo() {
        if (!new.target) {
            throw Error("Cannot be called without the new keyword");
        }
        this.signTransaction = (txns) => {
            return txns.map(txn => {
                return { txn: txn, blob: "fakeBlob" }
            })

        }
    }
}
require('./algo_delegate_template_teal.js');
require('./ASA_delegate_template_teal.js');
//require('./dex_teal.js');

const dexInternal = require('./algodex_internal_api.js');

if (MyAlgo != null) {
    myAlgoWallet = new MyAlgo();
    // console.debug("printing my algo wallet");
    // console.debug(myAlgoWallet)
}

const constants = require('./constants.js');
const { ESCROW_CONTRACT_VERSION } = require('./constants.js');
const signingApi = require('./signing_api.js');
const deprecate = require('./lib/functions/deprecate');

let ALGO_ESCROW_ORDER_BOOK_ID = -1;
let ASA_ESCROW_ORDER_BOOK_ID = -1;

// function Algodex({algod, indexer, dexd}){
//
// }

/**
 *
 * @todo Pass constants and configuration into API Constructor
 */
const AlgodexApi = {

    /**
     * @deprecated
     * @todo: Alert Users to import from '@algodex/algodex-sdk/functions'
     */
    doAlert : function doAlert() {
        alert(1);
        console.debug("api call!!!");
    },
    /**
     * @deprecated
     * @todo: Alert Users to import from '@algodex/algodex-sdk/functions'
     * @returns {{LOCAL_ALGOD_SERVER, PUBLIC_TEST_INDEXER_PORT: string, TEST_ASA_ORDERBOOK_APPID: number, PROD_ALGOD_SERVER: string|string, PUBLIC_TEST_ALGOD_SERVER: string|string, PUBLIC_TEST_BACKEND_API: string, PUBLIC_TEST_INDEXER_TOKEN: string, TEST_INDEXER_PORT: string, TEST_ALGOD_TOKEN: string|string, TEST_INDEXER_TOKEN: string, PROD_ALGO_ORDERBOOK_APPID: number, PROD_INDEXER_PORT: string, TEST_ALGOD_SERVER: string|string, LOCAL_ALGOD_TOKEN, MIN_ASA_ESCROW_BALANCE: number, PUBLIC_TEST_ASA_ORDERBOOK_APPID: number, TEST_INDEXER_SERVER: string, LOCAL_ASA_ORDERBOOK_APPID: number, PROD_BACKEND_API: string, TEST_BACKEND_API: string, PUBLIC_TEST_INDEXER_SERVER: string, TEST_ALGO_ORDERBOOK_APPID: number, LOCAL_INDEXER_SERVER: string, PROD_INDEXER_TOKEN: string, LOCAL_ALGO_ORDERBOOK_APPID: number, LOCAL_BACKEND_API: string, PROD_ALGOD_TOKEN: string|string, LOCAL_ALGOD_PORT, LOCAL_INDEXER_TOKEN: string, DEBUG: number, PROD_ALGOD_PORT: string|string, MIN_ESCROW_BALANCE: number, PROD_INDEXER_SERVER: string, ESCROW_CONTRACT_VERSION: number, DEBUG_SMART_CONTRACT_SOURCE: number|number, TEST_ALGOD_PORT: string|string, PUBLIC_TEST_ALGOD_TOKEN: string|string, PROD_ASA_ORDERBOOK_APPID: number, LOCAL_INDEXER_PORT: string, PUBLIC_TEST_ALGOD_PORT: string|string, INFO_SERVER: string, PUBLIC_TEST_ALGO_ORDERBOOK_APPID: number, ORDERBOOK_CONTRACT_VERSION: number}|{DEBUG?: number, DEBUG_SMART_CONTRACT_SOURCE?: number | number, INFO_SERVER?: string, ESCROW_CONTRACT_VERSION?: number, ORDERBOOK_CONTRACT_VERSION?: number, MIN_ESCROW_BALANCE?: number, MIN_ASA_ESCROW_BALANCE?: number, LOCAL_ALGOD_SERVER?: string|string, LOCAL_ALGOD_PORT?: string|string, LOCAL_ALGOD_TOKEN?: string|string, LOCAL_BACKEND_API?: string, LOCAL_INDEXER_SERVER?: string, LOCAL_INDEXER_PORT?: string, LOCAL_INDEXER_TOKEN?: string, LOCAL_ALGO_ORDERBOOK_APPID?: number, LOCAL_ASA_ORDERBOOK_APPID?: number, TEST_ALGOD_SERVER?: string | undefined | string, TEST_ALGOD_PORT?: string | undefined | string, TEST_ALGOD_TOKEN?: string | undefined | string, TEST_BACKEND_API?: string, TEST_INDEXER_SERVER?: string, TEST_INDEXER_PORT?: string, TEST_INDEXER_TOKEN?: string, TEST_ALGO_ORDERBOOK_APPID?: number, TEST_ASA_ORDERBOOK_APPID?: number, PUBLIC_TEST_ALGOD_SERVER?: string | undefined | string, PUBLIC_TEST_ALGOD_PORT?: string | undefined | string, PUBLIC_TEST_ALGOD_TOKEN?: string | undefined | string, PUBLIC_TEST_BACKEND_API?: string, PUBLIC_TEST_INDEXER_SERVER?: string, PUBLIC_TEST_INDEXER_PORT?: string, PUBLIC_TEST_INDEXER_TOKEN?: string, PUBLIC_TEST_ALGO_ORDERBOOK_APPID?: number, PUBLIC_TEST_ASA_ORDERBOOK_APPID?: number, PROD_ALGOD_SERVER?: string | undefined | string, PROD_ALGOD_PORT?: string | undefined | string, PROD_ALGOD_TOKEN?: string | undefined | string, PROD_BACKEND_API?: string, PROD_INDEXER_SERVER?: string, PROD_INDEXER_PORT?: string, PROD_INDEXER_TOKEN?: string, PROD_ALGO_ORDERBOOK_APPID?: number, PROD_ASA_ORDERBOOK_APPID?: number}}
     */
	getConstants : () => {
			return constants;
	},

    /**
     *
     * @param promises
     * @returns {Promise<unknown[]>}
     * @deprecated
     */
    allSettled: function (promises) {
        return helperFuncs.allSettled(promises)
    },

    /**
     * Initialize smart contract environments. This is also called from within
     * initIndexer() and initAlgodClient
     *
     * @param {String} environment Must be "local", "test", or "production".
     * @todo: Pass constants into API Constructor and use this.config.app.algo, this.app.asa
     * @deprecated
     */
    initSmartContracts : function(environment) {
        if (environment == "local") {
            ALGO_ESCROW_ORDER_BOOK_ID = constants.LOCAL_ALGO_ORDERBOOK_APPID;
            ASA_ESCROW_ORDER_BOOK_ID = constants.LOCAL_ASA_ORDERBOOK_APPID;
        } else if (environment == "test") {
            ALGO_ESCROW_ORDER_BOOK_ID = constants.TEST_ALGO_ORDERBOOK_APPID;
            ASA_ESCROW_ORDER_BOOK_ID = constants.TEST_ASA_ORDERBOOK_APPID;
        } else if (environment == "public_test") {
            ALGO_ESCROW_ORDER_BOOK_ID = constants.PUBLIC_TEST_ALGO_ORDERBOOK_APPID;
            ASA_ESCROW_ORDER_BOOK_ID = constants.PUBLIC_TEST_ASA_ORDERBOOK_APPID;
        } else if (environment == "production") {
            ALGO_ESCROW_ORDER_BOOK_ID = constants.PROD_ALGO_ORDERBOOK_APPID;
            ASA_ESCROW_ORDER_BOOK_ID = constants.PROD_ASA_ORDERBOOK_APPID;
        } else {
            throw "environment must be local, test, or production";
        }
        if ("ALGODEX_ALGO_ESCROW_APP" in process.env) {
            ALGO_ESCROW_ORDER_BOOK_ID = parseInt(process.env.ALGODEX_ALGO_ESCROW_APP)
        }
        if ("ALGODEX_ASA_ESCROW_APP" in process.env) {
            ASA_ESCROW_ORDER_BOOK_ID = parseInt(process.env.ALGODEX_ASA_ESCROW_APP)
        }
        //console.debug("ALGO APP ID:", ALGO_ESCROW_ORDER_BOOK_ID)
        //console.debug("ASA APP ID:", ASA_ESCROW_ORDER_BOOK_ID)

        dexInternal.initSmartContracts(ALGO_ESCROW_ORDER_BOOK_ID, ASA_ESCROW_ORDER_BOOK_ID);
        //console.debug({ALGO_ESCROW_ORDER_BOOK_ID, ASA_ESCROW_ORDER_BOOK_ID});
    },

    /**
     *
     * @param isAlgoEscrowApp
     * @returns {number}
     * @deprecated
     */
    getOrderBookId : function(isAlgoEscrowApp) {
        if (isAlgoEscrowApp) {
            return ALGO_ESCROW_ORDER_BOOK_ID;
        }
        return ASA_ESCROW_ORDER_BOOK_ID
    },


    /**
     *
     * @param accountInfo
     * @param includesFullAccountInfo
     * @returns {Promise<number>}
     * @deprecated
     */
    getMinWalletBalance : async function(accountInfo, includesFullAccountInfo = false) {
        if (!includesFullAccountInfo) {
            try {
                accountInfo = await this.getAccountInfo(accountInfo.address); // get full account info
            } catch (e) {
                return 1000000;
            }
        }
        if (!accountInfo || !accountInfo.address) {
            return 1000000;
        }
        console.debug("in getMinWalletBalance. Checking: " + accountInfo.address);
        console.debug({accountInfo});

        let minBalance = 0;

        if (accountInfo['created-apps']) {
            minBalance += 100000 * (accountInfo['created-apps'].length); // Apps
        }
        if (accountInfo['assets']) {
            minBalance += accountInfo['assets'].length * 100000;
        }
        if (accountInfo['apps-total-schema'] != undefined && accountInfo['apps-total-schema']['num-uint']) {
            minBalance += (25000+3500) * accountInfo['apps-total-schema']['num-uint']; // Total Ints
        }
        if (accountInfo['apps-total-schema'] != undefined && accountInfo['apps-total-schema']['num-byte-slice']) {
            minBalance += (25000+25000) * accountInfo['apps-total-schema']['num-byte-slice']; // Total Bytes
        }
        minBalance += 1000000;

        return minBalance;
    },

    /**
     * Initialize and return indexer client.
     *
     * @param {String} environment Must be "local", "test", or "production".
     * @todo: Pass constants into API Constructor and use this.indexer.server, this.indexer.port, this.indexer.token
     * @deprecated
     */
    initIndexer : function(environment) {
        let server = null;
        let port = null;
        let token = null;

        this.initSmartContracts(environment);

        if (environment == "local") {
            server = constants.LOCAL_INDEXER_SERVER;
            port =   constants.LOCAL_INDEXER_PORT;
            token =  constants.LOCAL_INDEXER_TOKEN;
        } else if (environment == "test") {
            server = constants.TEST_INDEXER_SERVER;
            port =   constants.TEST_INDEXER_PORT;
            token =  constants.TEST_INDEXER_TOKEN;
        } else if (environment == "public_test") {
            server = constants.PUBLIC_TEST_INDEXER_SERVER;
            port =   constants.PUBLIC_TEST_INDEXER_PORT;
            token =  constants.PUBLIC_TEST_INDEXER_TOKEN;
        } else if (environment == "production") {
            server = constants.PROD_INDEXER_SERVER;
            port =   constants.PROD_INDEXER_PORT;
            token =  constants.PROD_INDEXER_TOKEN;
        } else {
            throw "environment must be local, test, or production";
        }

        const indexerClient = new algosdk.Indexer(token, server, port);
        console.debug({server, port, token});

        dexInternal.setAlgodIndexer(server, port, token);

        return indexerClient;
    },

    /**
     * Initialize and return indexer client.
     *
     * @param {String} environment Must be "local", "test", or "production".
     * @todo: Pass constants into API Constructor and use this.algod.url, this.algod.port, this.algod.token
     * @deprecated
     */
    initAlgodClient : function(environment) {
        let algodServer = null;
        let port = null;
        let token = null;


        this.initSmartContracts(environment);

        if (environment == "local") {
            algodServer = constants.LOCAL_ALGOD_SERVER;
            port =   constants.LOCAL_ALGOD_PORT;
            token =  constants.LOCAL_ALGOD_TOKEN;
        } else if (environment == "test") {
            algodServer = constants.TEST_ALGOD_SERVER;
            port =   constants.TEST_ALGOD_PORT;
            token =  constants.TEST_ALGOD_TOKEN;
        } else if (environment == "public_test") {
            algodServer = constants.PUBLIC_TEST_ALGOD_SERVER;
            port =   constants.PUBLIC_TEST_ALGOD_PORT;
            token =  constants.PUBLIC_TEST_ALGOD_TOKEN;
        } else if (environment == "production") {
            algodServer = constants.PROD_ALGOD_SERVER;
            port =   constants.PROD_ALGOD_PORT;
            token =  constants.PROD_ALGOD_TOKEN;
        } else {
            throw "environment must be local, test, or production";
        }
        //console.debug({server: algodServer, token, port});
        const algodClient = new algosdk.Algodv2(token, algodServer, port);
        if (!!myAlgoWalletUtil) {
            myAlgoWalletUtil.setAlgodServer(algodServer);
        }
        dexInternal.setAlgodServer(algodServer);
        dexInternal.setAlgodPort(port);
        dexInternal.setAlgodToken(token);

        return algodClient;
    },

    /**
     * Wait for a transaction to be confirmed
     * @deprecated
     */
    waitForConfirmation : async function(txId) {
        return helperFuncs.waitForConfirmation(txId);
    },

    /**
     * @deprecated
     * @param x
     * @returns {string}
     */
    dumpVar(x) {
        return dexInternal.dumpVar(x);
    },

    /**
     * Converts a limitPrice to N and D values which are used to store the price in the
     * blockchain, since decimals can't be used for calculations in smart contracts.
     *
     * @param   {Number} limitPrice price of the base unit ASA in terms of microALGO
     * @returns {Object} contains N and D number values for usage in the smart contracts
     * @deprecated
     */
    getNumeratorAndDenominatorFromPrice : function getNumeratorAndDenominatorFromPrice(limitPrice) {
        let countDecimals = function (limitPrice) {
            if(Math.floor(limitPrice) === limitPrice) return 0;
            return limitPrice.toString().split(".")[1].length || 0;
        }

        const origDecCount = countDecimals(limitPrice);
        let d = 10**origDecCount * limitPrice;
        let n = 10**origDecCount;
        d = Math.round(d);
        n = Math.round(n);

        return {
            n: n,
            d: d
        }
    },

    /**
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
     * @deprecated
     */
    createOrderBookEntryObj : function createOrderBookEntryObj (blockChainOrderVal, price, n, d, min, escrowAddr,
                                            algoBalance, asaBalance, escrowOrderType, isASAEscrow, orderCreatorAddr, assetId, version=3) {
        const orderEntry =
            {
                orderEntry: blockChainOrderVal, // this should match what's in the blockchain
                price: price, // d/n
                n: n,
                d: d,
                min: min,
                escrowAddr: escrowAddr,
                algoBalance: algoBalance,
                asaBalance: asaBalance,
                escrowOrderType: escrowOrderType,
                isASAEscrow: isASAEscrow,
                orderCreatorAddr: orderCreatorAddr,
                assetId: assetId,
                version: version
            };
        return orderEntry;
    },

    /**
     *
     * @param queuedOrder
     * @returns {{cutOrderAmount: number, splitTimes: number}}
     * @deprecated
     */
    getCutOrderTimes : (queuedOrder) => {
            console.debug('in getCutOrderTimes: ', JSON.stringify(queuedOrder) );
            let cutOrderAmount = null, splitTimes = null;
            if (queuedOrder.isASAEscrow) {
                cutOrderAmount = Math.max(1, queuedOrder.asaBalance / 4);
                splitTimes = Math.floor(queuedOrder.asaBalance / cutOrderAmount);
            } else {
                const minOrderAmount = Math.max(queuedOrder.price + 1, 500000);
                cutOrderAmount = Math.max(minOrderAmount, queuedOrder.algoBalance / 4);
                splitTimes = Math.floor(queuedOrder.algoBalance / cutOrderAmount);
            }
            cutOrderAmount = Math.floor(cutOrderAmount);

            if (splitTimes == 0) {
                splitTimes = 1;
            }

            return {
                'cutOrderAmount': cutOrderAmount,
                'splitTimes': splitTimes
            };
    },

    /**
     * Executes a limit order as a taker and submits it to the blockchain
     *
     * @param {Object}    algodClient         object that has been initialized via initAlgodClient()
     * @param {Boolean}   isSellingASA        boolean true if the taker is selling the ASA to an ALGO-only escrow buy order
     * @param {Number}    assetId             Algorand ASA ID for the asset.
     * @param {String}    userWalletAddr      wallet address
     * @param {Number}    limitPrice          price of the base unit ASA in terms of microALGO
     * @param {Number}    orderAssetAmount    Must be integer. max amount of the asset to buy or sell in base units
     * @param {Number}    orderAlgoAmount     Must be integer. max amount of algo to buy or sell in microAlgos
     * @param {Object[]}  allOrderBookOrders  Array of objects each created via createOrderBookEntryObj
     * @returns {Object}                      Promise for when the batched transaction(s) are fully confirmed
     * @deprecated
     */
    executeOrder : async function executeOrder (algodClient, isSellingASA, assetId,
        userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker, walletConnector) {

        console.debug("in executeOrder");

        let queuedOrders = dexInternal.getQueuedTakerOrders(userWalletAddr, isSellingASA, allOrderBookOrders);
        let allTransList = [];
        let transNeededUserSigList = [];
        let execAccountInfo = await this.getAccountInfo(userWalletAddr);
        let alreadyOptedIn = false;
        console.debug("herezz56");
        console.debug({execAccountInfo});

        let takerMinBalance = await this.getMinWalletBalance(execAccountInfo, true);

        console.debug({min_bal: takerMinBalance});

        let walletAssetAmount = 0;
        const walletAlgoAmount = execAccountInfo['amount'] - takerMinBalance - (0.004 * 1000000);
        if (walletAlgoAmount <= 0) {
            console.debug("not enough to trade!! returning early");
            return;
        }

        if (execAccountInfo != null && execAccountInfo['assets'] != null
            && execAccountInfo['assets'].length > 0) {
            for (let i = 0; i < execAccountInfo['assets'].length; i++) {
                let asset = execAccountInfo['assets'][i];
                if (asset['asset-id'] == assetId) {
                    walletAssetAmount = asset['amount']
                    break;
                    //console.debug("execAccountInfo: " + execAccountInfo);
                }
            }
        }

        const getTakerOptedIn = (accountInfo, assetId) => {
            let takerAlreadyOptedIntoASA = false;
            if (accountInfo != null && accountInfo['assets'] != null
                && accountInfo['assets'].length > 0) {
                for (let i = 0; i < accountInfo['assets'].length; i++) {
                    if (accountInfo['assets'][i]['asset-id'] === assetId) {
                        takerAlreadyOptedIntoASA = true;
                        break;
                    }
                }
            }
            return takerAlreadyOptedIntoASA;
        }
        const takerIsOptedIn = getTakerOptedIn(execAccountInfo, assetId);

        orderAssetAmount = Math.max(1, orderAssetAmount);
        orderAlgoAmount = Math.max(1, orderAlgoAmount);

        if (isSellingASA) {
            // we are selling an ASA so check wallet balance
            orderAlgoBalance = walletAlgoAmount;
            orderAssetBalance = Math.min(orderAssetAmount, walletAssetAmount);
        } else {
            // wallet ASA balance doesn't matter since we are selling algos
            orderAlgoBalance = Math.min(orderAlgoAmount, walletAlgoAmount);
            orderAssetBalance = walletAssetAmount;
        }

        const takerOrderBalance = {
            'asaBalance': orderAssetBalance,
            'algoBalance': orderAlgoBalance,
            'walletAlgoBalance': walletAlgoAmount,
            'walletASABalance': walletAssetAmount,
            'limitPrice': limitPrice,
            'takerAddr': userWalletAddr,
            'walletMinBalance': takerMinBalance,
            'takerIsOptedIn': takerIsOptedIn
        };

        console.debug("initial taker orderbalance: ", this.dumpVar(takerOrderBalance));

        //let walletBalance = 10; // wallet balance
        //let walletASABalance = 15;
        if (queuedOrders == null && !includeMaker) {
            console.debug("null queued orders, returning early");
            return;
        }
        if (queuedOrders == null) {
            queuedOrders = [];
        }
        let txOrderNum = 0;
        let groupNum = 0;
        let txnFee = 0.004 * 1000000 //FIXME minimum fee;

        //console.debug("queued orders: ", this.dumpVar(queuedOrders));
        let params = await algodClient.getTransactionParams().do();
        let lastExecutedPrice = -1;

        const getCutOrderTimes = this.getCutOrderTimes;

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

            if (isSellingASA && parseFloat(takerOrderBalance['limitPrice']) > queuedOrders[i]['price']) {
                //buyer & seller prices don't match
                continue;
            }
            if (!isSellingASA && parseFloat(takerOrderBalance['limitPrice']) < queuedOrders[i]['price']) {
                //buyer & seller prices don't match
                continue;
            }


            // let cutOrder = null;
            // let splitTimes = 1;
            const getSplitTimesByIter = (i) => {
                let cutOrder = null;
                let splitTimes = 1;
                if (i == 0) {
                    cutOrder = getCutOrderTimes(queuedOrders[i]);
                    splitTimes = cutOrder.splitTimes;
                } else {
                    cutOrder = null;
                }
                return {cutOrder, splitTimes};
            }
            const {cutOrder, splitTimes} = getSplitTimesByIter(i);

            console.debug('cutOrder, splitTimes: ', {cutOrder, splitTimes});
            let runningBalance = queuedOrders[i].isASAEscrow ? queuedOrders[i].asaBalance :
                            queuedOrders[i].algoBalance;

            let outerBreak = false;
            for (let jj = 0; jj < splitTimes; jj++) {
                if (runningBalance <= 0) {
                    throw "Unexpected 0 or below balance";
                }
                console.debug("running balance: " + runningBalance + " isASAEscrow: " + queuedOrders[i].isASAEscrow);
                const queuedOrder = Object.assign({}, queuedOrders[i]);

                if (cutOrder != null) {
                    const shouldClose =  (jj < cutOrder.splitTimes - 1) ? false : null;
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
                            queuedOrder.asaBalance = Math.min(cutOrder.cutOrderAmount, runningBalance);
                        } else {
                            queuedOrder.algoBalance = Math.min(cutOrder.cutOrderAmount, runningBalance);
                        }
                    }
                }
                let singleOrderTransList =
                    await dexInternal.getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient,
                        queuedOrder, takerOrderBalance, params, walletConnector);


                if (singleOrderTransList == null) {
                    // Overspending issue
                    outerBreak = true;
                    break;

                }
                const [algo, asa] = this.getAlgoandAsaAmounts(singleOrderTransList);



                this.finalPriceCheck(algo ,asa , limitPrice, isSellingASA)


                lastExecutedPrice = queuedOrder['price'];

                for (let k = 0; k < singleOrderTransList.length; k++) {
                    let trans = singleOrderTransList[k];
                    trans['txOrderNum'] = txOrderNum;
                    trans['groupNum'] = groupNum;
                    txOrderNum++;
                    allTransList.push(trans);
                    if (trans['needsUserSig'] === true) {
                        transNeededUserSigList.push(trans);
                    }
                }
                groupNum++;

                runningBalance -= cutOrder != null ? cutOrder.cutOrderAmount : 0;
            }
            if (outerBreak) {
                break;
            }
        }




        let makerTxns = null;
        console.debug('here55999a ', {lastExecutedPrice, limitPrice} );
        if (includeMaker) {
            const numAndDenom = lastExecutedPrice != -1 ? this.getNumeratorAndDenominatorFromPrice(lastExecutedPrice) :
                                                          this.getNumeratorAndDenominatorFromPrice(limitPrice);
            let leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
            let leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
            console.debug("includeMaker is true");
            if (isSellingASA && leftoverASABalance > 0) {
                console.debug("leftover ASA balance is: " + leftoverASABalance);

                makerTxns = await this.getPlaceASAToSellASAOrderIntoOrderbook(algodClient,
                    userWalletAddr, numAndDenom.n, numAndDenom.d, 0, assetId, leftoverASABalance, false, walletConnector );
            } else if (!isSellingASA && leftoverAlgoBalance > 0) {
                console.debug("leftover Algo balance is: " + leftoverASABalance);

                makerTxns = await this.getPlaceAlgosToBuyASAOrderIntoOrderbook(algodClient,
                    userWalletAddr, numAndDenom.n, numAndDenom.d, 0, assetId, leftoverAlgoBalance, false, walletConnector);
            }
        }

        if (makerTxns != null) {
            for (let k = 0; k < makerTxns.length; k++) {
                let trans = makerTxns[k];
                trans['txOrderNum'] = txOrderNum;
                trans['groupNum'] = groupNum;
                txOrderNum++;
                allTransList.push(trans);
                if (trans['needsUserSig'] === true) {
                    transNeededUserSigList.push(trans);
                }

                if (typeof(trans.lsig) !== 'undefined') {
                    if(!walletConnector || !walletConnector.connector.connected) {
                        let signedTxn = algosdk.signLogicSigTransactionObject(trans.unsignedTxn, trans.lsig);
                        trans.signedTxn = signedTxn.blob;

                    }

                }
            }
            groupNum++;
        }

        if (allTransList == null || allTransList.length == 0) {
            console.debug("no transactions, returning early");
        }

        let txnsForSigning = [];
        for (let i = 0; i < transNeededUserSigList.length; i++) {
            txnsForSigning.push(transNeededUserSigList[i]['unsignedTxn']);
        }

        console.debug("here 8899b signing!!");
        if (txnsForSigning == null || txnsForSigning.length == 0) {
            return;
        }

        if(!!walletConnector && walletConnector.connector.connected) {
            const confirmedWalletConnectArr = await this.signAndSendWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
            return confirmedWalletConnectArr;

          }

        let signedTxns =  await myAlgoWallet.signTransaction(txnsForSigning);

        if (!Array.isArray(signedTxns)) {
            signedTxns = [signedTxns];
        }

        for (let i = 0; i < transNeededUserSigList.length; i++) {
            transNeededUserSigList[i]['signedTxn'] = signedTxns[i].blob;
        }
        signedTxns = [];
        let sentTxns = [];

        let lastGroupNum = -1;
        for (let i = 0; i < allTransList.length; i++) {  // loop to end of array
            if (lastGroupNum != allTransList[i]['groupNum']) {
                // If at beginning of new group, send last batch of transactions
                if (signedTxns.length > 0) {
                    try {
                        this.printTransactionDebug(signedTxns);
                        let txn = await algodClient.sendRawTransaction(signedTxns).do();
                        sentTxns.push(txn.txId);
                        console.debug("sent: " + txn.txId);
                    }  catch (e) {
                        console.debug(e);
                    }
                }
                // send batch of grouped transactions
                signedTxns = [];
                lastGroupNum = allTransList[i]['groupNum'];
            }

            signedTxns.push(allTransList[i]['signedTxn']);

            if (i == allTransList.length - 1) {
                // If at end of list send last batch of transactions
                if (signedTxns.length > 0) {
                    try {
                        this.printTransactionDebug(signedTxns);
                        const DO_SEND = true;
                        if (DO_SEND) {
                            let txn = await algodClient.sendRawTransaction(signedTxns).do();
                            sentTxns.push(txn.txId);
                            console.debug("sent: " + txn.txId);
                        } else {
                            console.debug("skipping sending for debugging reasons!!!");
                        }
                    }  catch (e) {
                        console.debug(e);
                    }
                }
                break;
            }

        }

        console.debug("going to wait for confirmations");

        let waitConfirmedPromises = [];

        for (let i = 0; i < sentTxns.length; i++) {
            console.debug("creating promise to wait for: " + sentTxns[i]);
            const confirmPromise = this.waitForConfirmation(sentTxns[i]);
            waitConfirmedPromises.push(confirmPromise);
        }

        console.debug("final9 trans are: " );
        // console.debug(alTransList);
        // console.debug(transNeededUserSigList);

        console.debug("going to send all ");

        let confirmedTransactions = await this.allSettled(waitConfirmedPromises);

        let transResults = JSON.stringify(confirmedTransactions, null, 2);
        console.debug("trans results after confirmed are: " );
        console.debug(transResults);
       // await this.waitForConfirmation(algodClient, txn.txId);
        return;
    },

    /**
     *
     * @param algodClient
     * @param isSellingASA
     * @param assetId
     * @param userWalletAddr
     * @param limitPrice
     * @param orderAssetAmount
     * @param orderAlgoAmount
     * @param allOrderBookOrders
     * @param includeMaker
     * @param walletConnector
     * @returns {Promise<{params: Data, allTransList: *[]}>}
     * @deprecated
     */
    structureOrder: async function (algodClient, isSellingASA, assetId,
        userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker, walletConnector) {

        console.debug("in structureOrder");

        let queuedOrders = dexInternal.getQueuedTakerOrders(userWalletAddr, isSellingASA, allOrderBookOrders);
        let allTransList = [];
        let transNeededUserSigList = [];
        let execAccountInfo = await this.getAccountInfo(userWalletAddr);
        let alreadyOptedIn = false;
        console.debug("herezz56");
        console.debug({ execAccountInfo });

        let takerMinBalance = await this.getMinWalletBalance(execAccountInfo, true);

        console.debug({ min_bal: takerMinBalance });

        let walletAssetAmount = 0;
        const walletAlgoAmount = execAccountInfo['amount'] - takerMinBalance - (0.004 * 1000000);
        if (walletAlgoAmount <= 0) {
            console.debug("not enough to trade!! returning early");
            return;
        }

        if (execAccountInfo != null && execAccountInfo['assets'] != null
            && execAccountInfo['assets'].length > 0) {
            for (let i = 0; i < execAccountInfo['assets'].length; i++) {
                let asset = execAccountInfo['assets'][i];
                if (asset['asset-id'] == assetId) {
                    walletAssetAmount = asset['amount']
                    break;
                    //console.debug("execAccountInfo: " + execAccountInfo);
                }
            }
        }

        const getTakerOptedIn = (accountInfo, assetId) => {
            let takerAlreadyOptedIntoASA = false;
            if (accountInfo != null && accountInfo['assets'] != null
                && accountInfo['assets'].length > 0) {
                for (let i = 0; i < accountInfo['assets'].length; i++) {
                    if (accountInfo['assets'][i]['asset-id'] === assetId) {
                        takerAlreadyOptedIntoASA = true;
                        break;
                    }
                }
            }
            return takerAlreadyOptedIntoASA;
        }
        const takerIsOptedIn = getTakerOptedIn(execAccountInfo, assetId);

        orderAssetAmount = Math.max(1, orderAssetAmount);
        orderAlgoAmount = Math.max(1, orderAlgoAmount);


        if (isSellingASA) {
            // we are selling an ASA so check wallet balance
            orderAlgoBalance = walletAlgoAmount;
            orderAssetBalance = Math.min(orderAssetAmount, walletAssetAmount);
        } else {
            // wallet ASA balance doesn't matter since we are selling algos
            orderAlgoBalance = Math.min(orderAlgoAmount, walletAlgoAmount);
            orderAssetBalance = walletAssetAmount;
        }

        const takerOrderBalance = {
            'asaBalance': orderAssetBalance,
            'algoBalance': orderAlgoBalance,
            'walletAlgoBalance': walletAlgoAmount,
            'walletASABalance': walletAssetAmount,
            'limitPrice': limitPrice,
            'takerAddr': userWalletAddr,
            'walletMinBalance': takerMinBalance,
            'takerIsOptedIn': takerIsOptedIn
        };

        console.debug("initial taker orderbalance: ", this.dumpVar(takerOrderBalance));

        //let walletBalance = 10; // wallet balance
        //let walletASABalance = 15;
        if (queuedOrders == null && !includeMaker) {
            console.debug("null queued orders, returning early");
            return;
        }
        if (queuedOrders == null) {
            queuedOrders = [];
        }
        let txOrderNum = 0;
        let groupNum = 0;
        let txnFee = 0.004 * 1000000 //FIXME minimum fee;

        //console.debug("queued orders: ", this.dumpVar(queuedOrders));
        let params = await algodClient.getTransactionParams().do();
        let lastExecutedPrice = -1;

        const getCutOrderTimes = this.getCutOrderTimes;


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

            if (isSellingASA && parseFloat(takerOrderBalance['limitPrice']) > queuedOrders[i]['price']) {
                //buyer & seller prices don't match
                continue;
            }
            if (!isSellingASA && parseFloat(takerOrderBalance['limitPrice']) < queuedOrders[i]['price']) {
                //buyer & seller prices don't match
                continue;
            }


            // let cutOrder = null;
            // let splitTimes = 1;
            const getSplitTimesByIter = (i) => {
                let cutOrder = null;
                let splitTimes = 1;
                if (i == 0) {
                    cutOrder = getCutOrderTimes(queuedOrders[i]);
                    splitTimes = cutOrder.splitTimes;
                } else {
                    cutOrder = null;
                }
                return { cutOrder, splitTimes };
            }
            const { cutOrder, splitTimes } = getSplitTimesByIter(i);

            console.debug('cutOrder, splitTimes: ', { cutOrder, splitTimes });
            let runningBalance = queuedOrders[i].isASAEscrow ? queuedOrders[i].asaBalance :
                queuedOrders[i].algoBalance;

            let outerBreak = false;
            for (let jj = 0; jj < splitTimes; jj++) {
                if (runningBalance <= 0) {
                    throw "Unexpected 0 or below balance";
                }
                console.debug("running balance: " + runningBalance + " isASAEscrow: " + queuedOrders[i].isASAEscrow);
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
                            queuedOrder.asaBalance = Math.min(cutOrder.cutOrderAmount, runningBalance);
                        } else {
                            queuedOrder.algoBalance = Math.min(cutOrder.cutOrderAmount, runningBalance);
                        }
                    }
                }
                let singleOrderTransList =
                    await dexInternal.getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient,
                        queuedOrder, takerOrderBalance, params, walletConnector);



                if (singleOrderTransList == null) {
                    // Overspending issue
                    outerBreak = true;
                    break;

                }
                const [algo, asa] = this.getAlgoandAsaAmounts(singleOrderTransList);



                this.finalPriceCheck(algo, asa, limitPrice, isSellingASA)


                lastExecutedPrice = queuedOrder['price'];

                for (let k = 0; k < singleOrderTransList.length; k++) {
                    let trans = singleOrderTransList[k];
                    trans['txOrderNum'] = txOrderNum;
                    trans['groupNum'] = groupNum;
                    txOrderNum++;
                    allTransList.push(trans);
                    if (trans['needsUserSig'] === true) {
                        transNeededUserSigList.push(trans);
                    }
                }
                groupNum++;

                runningBalance -= cutOrder != null ? cutOrder.cutOrderAmount : 0;
            }
            if (outerBreak) {
                break;
            }
        }


        let makerTxns = null;
        console.debug('here55999a ', { lastExecutedPrice, limitPrice });
        if (includeMaker) {
            const numAndDenom = lastExecutedPrice != -1 ? this.getNumeratorAndDenominatorFromPrice(lastExecutedPrice) :
                this.getNumeratorAndDenominatorFromPrice(limitPrice);
            let leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
            let leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
            console.debug("includeMaker is true");
            if (isSellingASA && leftoverASABalance > 0) {
                console.debug("leftover ASA balance is: " + leftoverASABalance);

                makerTxns = await this.getPlaceASAToSellASAOrderIntoOrderbookV2(algodClient,
                    userWalletAddr, numAndDenom.n, numAndDenom.d, 0, assetId, leftoverASABalance, false, walletConnector);
            } else if (!isSellingASA && leftoverAlgoBalance > 0) {
                console.debug("leftover Algo balance is: " + leftoverASABalance);

                makerTxns = await this.getPlaceAlgosToBuyASAOrderIntoOrderbookV2(algodClient,
                    userWalletAddr, numAndDenom.n, numAndDenom.d, 0, assetId, leftoverAlgoBalance, false, walletConnector);
            }
        }
// below conditional handles output for getPlaceAlgos when signAndSend is false so returns unsigned Lsig
        if (makerTxns != null) {
            for (let k = 0; k < makerTxns.length; k++) {
                let trans = makerTxns[k];
                trans['txOrderNum'] = txOrderNum;
                trans['groupNum'] = groupNum;
                txOrderNum++;
                allTransList.push(trans);
                if (trans['needsUserSig'] === true) {
                    transNeededUserSigList.push(trans);
                }

            }
            groupNum++;
        }

        if (allTransList == null || allTransList.length == 0) {
            console.debug("no transactions, returning early");
        }

        let txnsForSigning = [];
        for (let i = 0; i < transNeededUserSigList.length; i++) {
            txnsForSigning.push(transNeededUserSigList[i]['unsignedTxn']);
        }

        console.debug("here 8899b signing!!");
        if (txnsForSigning == null || txnsForSigning.length == 0) {
            return;
        }

        return{params, allTransList}
    },

    /**
     * Closes an existing order and refunds the escrow account to the owner
     *
     * @param {Object}       algodClient: object that has been initialized via initAlgodClient()
     * @param {String} escrowAccountAddr: public address of the escrow account
     * @param {String}       creatorAddr: public address of the owner of the escrow account
     * @param {Object}    orderBookEntry: blockchain order book string. For example "2500-625-0-15322902" (N-D-min-assetId)
     * @param {int}       version:        escrow version as an int.
     * @returns {Object} Promise for when the transaction is fully confirmed
     * @deprecated
     */
    closeOrderFromOrderBookEntry : async function closeOrderFromOrderBookEntry(algodClient, escrowAccountAddr, creatorAddr, orderBookEntry, version, walletConnector) {
            let valSplit = orderBookEntry.split("-");
            console.debug("closing order from order book entry!");
            console.debug("escrowAccountAddr, creatorAddr, orderBookEntry, version",
                escrowAccountAddr, creatorAddr, orderBookEntry, version);

            let n = valSplit[0];
            let d = valSplit[1];
            let min = valSplit[2];
            let assetid = valSplit[3];
            let infoForMetadata= {n:n, d:d, min:min, orderBookEntry: orderBookEntry, version:version}
            let appArgs = [];
            let enc = new TextEncoder();
            appArgs.push(enc.encode("close"));
            appArgs.push(enc.encode(orderBookEntry));
            // appArgs.push(enc.encode(creatorAddr));
            console.debug("args length: " + appArgs.length);
            let accountInfo = await this.getAccountInfo(escrowAccountAddr);
            let assetId = null;
            if (accountInfo != null && accountInfo['assets'] != null
                && accountInfo['assets'].length > 0 && accountInfo['assets'][0] != null) {
                // check if escrow has an assetId in the blockchain
                assetId = accountInfo['assets'][0]['asset-id'];
            }
            const isAsaOrder = (assetId != null);


            let escrowSource = this.buildDelegateTemplateFromArgs(min,assetid,n,d,creatorAddr, isAsaOrder, version);

            let lsig = await dexInternal.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
            console.debug("lsig is: " + lsig.address());

            if (lsig.address() != escrowAccountAddr) {
                throw 'Lsig address does not equal input address! ' + lsig.address() + ' vs ' + escrowAccountAddr;
            }

            if (assetId == null) {
                console.debug("closing order");
                await dexInternal.closeOrderV2(algodClient, escrowAccountAddr, creatorAddr, ALGO_ESCROW_ORDER_BOOK_ID, appArgs, lsig, infoForMetadata, walletConnector);
            } else {
                console.debug("closing ASA order");
                await dexInternal.closeASAOrderV2(algodClient, escrowAccountAddr, creatorAddr, ASA_ESCROW_ORDER_BOOK_ID, appArgs, lsig, assetId, infoForMetadata, walletConnector);
            }
    },

    /**
     *
     * @param txns
     * @deprecated
     */
    assignGroups: function assignGroups (txns) {
        const groupID = algosdk.computeGroupID(txns)
        for (let i = 0; i < txns.length; i++) {
            txns[i].group = groupID;
        }
    },

    /**
     *
     * @param algoAmount
     * @param asaAmount
     * @param limitPrice
     * @param isSellingASA
     * @deprecated
     */
    finalPriceCheck: function finalPriceCheck(algoAmount,asaAmount, limitPrice, isSellingASA) {
        function LimitPriceException(message) {
            this.message = message;
            this.name = 'LimitPriceException';
          }
          LimitPriceException.prototype = Error.prototype;
          const buyLimit = new BigN(limitPrice).multiply(new BigN(1.002));
          const sellLimit = new BigN(limitPrice).multiply(new BigN(0.998));

          if (!isSellingASA
              && new BigN(algoAmount).divide(new BigN(asaAmount)).compareTo(buyLimit) === GREATER_THAN) {
              // Throw an exception if price is 0.2% higher than limit price set by user
              throw new LimitPriceException("Attempting to buy at a price higher than limit price");
          }

          if (isSellingASA
              && new BigN(algoAmount).divide(new BigN(asaAmount)).compareTo(sellLimit) === LESS_THAN) {
              // Throw an exception if price is 0.2% lower than limit price set by user
              throw new LimitPriceException("Attempting to sell at a price lower than limit price");
          }

        console.debug({algoAmount, asaAmount, limitPrice});

        return


    },

    /**
     *
     * @param txnList
     * @returns {[*,*]}
     * @deprecated
     */
    getAlgoandAsaAmounts:
         function (txnList) {
            const algo = txnList
            .filter(
                (txObj) =>{
                    return Object.keys(txObj).includes("txType") &&
                    txObj.txType === "algo"}
            )
            .map((txObj) => txObj.amount)[0];

        const asa = txnList
            .filter(
                (txObj) =>{
                    return Object.keys(txObj).includes("txType") &&
                    txObj.txType === "asa"}
            )
            .map((txObj) => txObj.amount)[0];



            return [algo, asa];
        },


    /**
     *
     * @param algodClient
     * @param outerTxns
     * @param params
     * @param walletConnector
     * @returns {Promise<*>}
     * @deprecated
     */
    signAndSendWalletConnectTransactions:
        async function (algodClient, outerTxns, params, walletConnector) {
            const groupBy = (items, key) => items.reduce(
                (result, item) => ({
                    ...result,
                    [item[key]]: [
                        ...(result[item[key]] || []),
                        item,
                    ],
                }),
                {},
            );
            const groups = groupBy(outerTxns, "groupNum");

            let numberOfGroups = Object.keys(groups);

            const groupedGroups = numberOfGroups.map(group => {

                const allTxFormatted = (groups[group].map(txn => {
                    if (!txn.unsignedTxn.name) {
                        if (txn.unsignedTxn.type === "pay") {return algosdk.makePaymentTxnWithSuggestedParams(txn.unsignedTxn.from, txn.unsignedTxn.to, txn.unsignedTxn.amount, undefined, undefined, params)}
                        if (txn.unsignedTxn.type === "axfer") {return algosdk.makeAssetTransferTxnWithSuggestedParams(txn.unsignedTxn.from, txn.unsignedTxn.to, undefined, undefined, txn.unsignedTxn.amount, undefined, txn.unsignedTxn.assetIndex, params)}
                    } else {
                        return txn.unsignedTxn;
                    }
                }))
                algosdk.assignGroupID(allTxFormatted.map(toSign => toSign));
                return allTxFormatted;
            }
            )

            const txnsToSign = groupedGroups.map(group => {
                const encodedGroup = group.map(txn => {
                    const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
                    if (algosdk.encodeAddress(txn.from.publicKey) !== walletConnector.connector.accounts[0]) return { txn: encodedTxn, signers: [] };
                    return { txn: encodedTxn };
                })
                return encodedGroup;
            })

            const formattedTxn = txnsToSign.flat();

            const request = formatJsonRpcRequest("algo_signTxn", [formattedTxn]);

            const result = await walletConnector.connector.sendCustomRequest(request);


            let resultsFormattted = result.map((element, idx) => {
                return element ? {
                    txID: formattedTxn[idx].txn,
                    blob: new Uint8Array(Buffer.from(element, "base64"))
                } : {
                    ...algosdk.signLogicSigTransactionObject(outerTxns[idx].unsignedTxn, outerTxns[idx].lsig)
                };
            });

            let orderedRawTransactions = resultsFormattted.map(obj => obj.blob);

            for (let i = 0; i < outerTxns.length; i++) {
                outerTxns[i]['signedTxn'] = orderedRawTransactions[i];
            }

            return outerTxns;
        },
    /**
     *
     * @param algodClient
     * @param outerTxns
     * @returns {Promise<void>}
     * @deprecated
     */
    propogateTransactions:
        async function propogateTransactions(algodClient, outerTxns) {
            let lastGroupNum = -1;
            let signedTxns= []
            let sentTxns = [];
            for (let i = 0; i < outerTxns.length; i++) {  // loop to end of array
                if (lastGroupNum != outerTxns[i]['groupNum']) {
                    // If at beginning of new group, send last batch of transactions
                    if (signedTxns.length > 0) {
                        try {
                            this.printTransactionDebug(signedTxns);
                            let txn = await algodClient.sendRawTransaction(signedTxns).do();
                            sentTxns.push(txn.txId);
                            console.debug("sent: " + txn.txId);
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                    // send batch of grouped transactions
                    signedTxns = [];
                    lastGroupNum = outerTxns[i]['groupNum'];
                }

                signedTxns.push(outerTxns[i]['signedTxn']);

                if (i == outerTxns.length - 1) {
                    // If at end of list send last batch of transactions
                    if (signedTxns.length > 0) {
                        try {
                            this.printTransactionDebug(signedTxns);
                            const DO_SEND = true;
                            if (DO_SEND) {
                                let txn = await algodClient.sendRawTransaction(signedTxns).do();
                                sentTxns.push(txn.txId);
                                console.debug("sent: " + txn.txId);
                            } else {
                                console.debug("skipping sending for debugging reasons!!!");
                            }
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                    break;
                }

            }
            console.debug("going to wait for confirmations");

            let waitConfirmedPromises = [];

            for (let i = 0; i < sentTxns.length; i++) {
                console.debug("creating promise to wait for: " + sentTxns[i]);
                const confirmPromise = this.waitForConfirmation(sentTxns[i]);
                waitConfirmedPromises.push(confirmPromise);
            }

            console.debug("final9 trans are: ");
            // console.debug(alTransList);
            // console.debug(transNeededUserSigList);

            console.debug("going to send all ");

            let confirmedTransactions = await this.allSettled(waitConfirmedPromises);

            let transResults = JSON.stringify(confirmedTransactions, null, 2);
            console.debug("trans results after confirmed are: ");
            console.debug(transResults);
            // await this.waitForConfirmation(algodClient, txn.txId);
            return;


        },
    /**
     *
     * @param algodClient
     * @param outerTxns
     * @returns {Promise<*>}
     * @deprecated
     */
    signMyAlgo:
        async function signMyAlgo(algodClient, outerTxns) {
            const needsUserSig = outerTxns.filter(transaction => !!transaction.unsignedTxn).map(transaction => transaction.unsignedTxn)
            // myAlgo userSigning doesn't want lSIGS. This will go away when we remove the signing of LSIGS from the structure order helper functions.

            let signedTxnsFromUser =  await myAlgoWallet.signTransaction(needsUserSig);

            if (Array.isArray(signedTxnsFromUser)) {
                let userSigIndex = 0;
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser[userSigIndex].blob;
                        userSigIndex++;
                    }
                }
            } else {
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser.blob;
                        break;
                    }
                }
            }

            return outerTxns
        },

    /**
     *
     * @param algodClient
     * @param outerTxns
     * @returns {Promise<{statusMsg: string, txId, transaction: (*|(function((string|Iterable<string>), IDBTransactionMode=): IDBTransaction)|(function(function(SQLTransactionSync): void): void)|(function((string|string[]), IDBTransactionMode=): IDBTransaction)|IDBTransaction|(function(function(SQLTransaction): void, function(SQLError): void=, function(): void=): void)), status: string}>}
     * @deprecated
     */
    signAndSendTransactions :
        async function signAndSendTransactions(algodClient, outerTxns) {
            console.debug("inside signAndSend transactions");
            let txnsForSig = [];
            let txns = [];

            for (let i = 0; i < outerTxns.length; i++) {
                txns.push(outerTxns[i].unsignedTxn);
                if (outerTxns[i].needsUserSig == true) {
                    txnsForSig.push(outerTxns[i].unsignedTxn);
                }
            }


            this.assignGroups(txns);

            let signedTxnsFromUser =  await myAlgoWallet.signTransaction(txnsForSig);

            if (Array.isArray(signedTxnsFromUser)) {
                let userSigIndex = 0;
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser[userSigIndex].blob;
                        userSigIndex++;
                    }
                }
            } else {
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser.blob;
                        break;
                    }
                }
            }

            for (let i = 0; i < outerTxns.length; i++) {
                if (!outerTxns[i].needsUserSig) {
                    let signedLsig = await algosdk.signLogicSigTransactionObject(outerTxns[i].unsignedTxn, outerTxns[i].lsig);
                    outerTxns[i].signedTxn = signedLsig.blob;
                }
            }

            let signed = [];

            for (let i = 0; i < outerTxns.length; i++) {
                signed.push(outerTxns[i].signedTxn);
            }
            console.debug("printing transaction debug");
            this.printTransactionDebug(signed);

            const groupTxn = await algodClient.sendRawTransaction(signed).do()
            return this.waitForConfirmation(groupTxn.txId)
    },
    /**
     *
     * @param makerWalletAddr
     * @param n
     * @param d
     * @param min
     * @param assetId
     * @param includeMakerAddr
     * @returns {string}
     * @deprecated
     */
    generateOrder : function (makerWalletAddr, n, d, min, assetId, includeMakerAddr) {
        return dexInternal.generateOrder(makerWalletAddr, n, d, min, assetId, includeMakerAddr);
    },
    /**
     *
     * @param algodClient
     * @param makerWalletAddr
     * @param n
     * @param d
     * @param min
     * @param assetId
     * @param algoOrderSize
     * @param signAndSend
     * @param walletConnector
     * @deprecated
     * @returns {Promise<*|undefined|*[]>}
     */
    getPlaceAlgosToBuyASAOrderIntoOrderbookV2:
        async function (algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, signAndSend, walletConnector) {
            console.debug("placeAlgosToBuyASAOrderIntoOrderbook makerWalletAddr, n, d, min, assetId",
                makerWalletAddr, n, d, min, assetId);
            let program = this.buildDelegateTemplateFromArgs(min, assetId, n, d, makerWalletAddr, false, constants.ESCROW_CONTRACT_VERSION);

            let lsig = await this.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
            let generatedOrderEntry = dexInternal.generateOrder(makerWalletAddr, n, d, min, assetId);
            console.debug("address is: " + lsig.address());
            console.debug("here111 generatedOrderEntry " + generatedOrderEntry);
            // check if the lsig has already opted in
            let alreadyOptedIntoOrderbook = false;
            let makerAccountInfo = await this.getAccountInfo(makerWalletAddr);
            let makerAlreadyOptedIntoASA = false;
            if (makerAccountInfo != null && makerAccountInfo['assets'] != null
                && makerAccountInfo['assets'].length > 0) {
                for (let i = 0; i < makerAccountInfo['assets'].length; i++) {
                    if (makerAccountInfo['assets'][i]['asset-id'] === assetId) {
                        makerAlreadyOptedIntoASA = true;
                        break;
                    }
                }
            }


            console.debug({ makerAlreadyOptedIntoASA });
            console.debug({ alreadyOptedIntoOrderbook });

            if (alreadyOptedIntoOrderbook == false && algoOrderSize < constants.MIN_ASA_ESCROW_BALANCE) {
                algoOrderSize = constants.MIN_ASA_ESCROW_BALANCE;
            }
            console.debug("alreadyOptedIn: " + alreadyOptedIntoOrderbook);
            // console.debug("acct info:" + JSON.stringify(escrowAccountInfo));

            let params = await algodClient.getTransactionParams().do();
            console.debug("sending trans to: " + lsig.address());
            let txn = {
                ...params,
                type: 'pay',
                from: makerWalletAddr,
                to: lsig.address(),
                amount: parseInt(algoOrderSize), // the order size that gets stored into the contract account
            };

            let outerTxns = [];

            outerTxns.push({
                unsignedTxn: txn,
                needsUserSig: true
            });

            myAlgoWalletUtil.setTransactionFee(txn);

            console.debug("here3 calling app from logic sig to open order");
            let appArgs = [];
            var enc = new TextEncoder();
            appArgs.push(enc.encode("open"));
            //console.debug("before slice: " + generatedOrderEntry);
            console.debug(generatedOrderEntry.slice(59));
            //console.debug("after slice: " + generatedOrderEntry.slice(59));

            appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
            //let arr = Uint8Array.from([0x2]);
            let arr = Uint8Array.from([constants.ESCROW_CONTRACT_VERSION]);
            appArgs.push(arr);
            console.debug("app args 2: " + arr);
            //console.debug("owners bit addr: " + ownersBitAddr);
            //console.debug("herezzz_888");
            console.debug(appArgs.length);
            let logSigTrans = null;

            if (!alreadyOptedIntoOrderbook) {
                logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig,
                    ALGO_ESCROW_ORDER_BOOK_ID, appArgs, "appOptIn", params);
                outerTxns.push({
                    unsignedTxn: logSigTrans,
                    needsUserSig: false,
                    lsig: lsig
                });
            }
            // asset opt-in transfer
            let assetOptInTxn = null;

            if (!makerAlreadyOptedIntoASA) {
                assetOptInTxn = {
                    type: "axfer",
                    from: makerWalletAddr,
                    to: makerWalletAddr,
                    amount: 0,
                    assetIndex: assetId,
                    ...params
                };
                outerTxns.push({
                    unsignedTxn: assetOptInTxn,
                    needsUserSig: true
                });
            }

            unsignedTxns = [];
            for (let i = 0; i < outerTxns.length; i++) {
                unsignedTxns.push(outerTxns[i].unsignedTxn);
            }


            let noteMetadata = {
                algoBalance: makerAccountInfo.amount,
                asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
                assetId: assetId,
                n: n,
                d: d,
                escrowAddr: lsig.address(),
                orderEntry: generatedOrderEntry,
                escrowOrderType: "buy",
                version: constants.ESCROW_CONTRACT_VERSION
            }
            // look into accuracy of above object

            unsignedTxns = dexInternal.formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, "open", "algo")

            if (signAndSend) {
                if (!!walletConnector && walletConnector.connector.connected) {
                    const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector);
                    return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
                } else {
                    const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(outerTxns);
                    return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
                    // When we remove the signing of LSIGS from the other functions the signing of LSIG functionality found in this function can be moved to the new myAlgoSign function
                }
            }


            // if(!walletConnector || !walletConnector.connector.connected){this.assignGroups(unsignedTxns)};

            return outerTxns;
        },

    /**
     *
     * @param algodClient
     * @param makerWalletAddr
     * @param n
     * @param d
     * @param min
     * @param assetId
     * @param algoOrderSize
     * @param signAndSend
     * @param walletConnector
     * @deprecated
     * @returns {Promise<*|undefined|*[]>}
     */
    getPlaceAlgosToBuyASAOrderIntoOrderbook : async function
        getPlaceAlgosToBuyASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, signAndSend, walletConnector) {
        console.debug("placeAlgosToBuyASAOrderIntoOrderbook makerWalletAddr, n, d, min, assetId",
            makerWalletAddr, n, d, min, assetId);
        let program = this.buildDelegateTemplateFromArgs(min, assetId, n, d, makerWalletAddr, false, constants.ESCROW_CONTRACT_VERSION);

        let lsig = await this.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
        let generatedOrderEntry = dexInternal.generateOrder(makerWalletAddr, n, d, min, assetId);
        console.debug("address is: " + lsig.address());
        console.debug("here111 generatedOrderEntry " + generatedOrderEntry);
        // check if the lsig has already opted in
        let alreadyOptedIntoOrderbook = false;
        let makerAccountInfo = await this.getAccountInfo(makerWalletAddr);
        let makerAlreadyOptedIntoASA = false;
        if (makerAccountInfo != null && makerAccountInfo['assets'] != null
            && makerAccountInfo['assets'].length > 0) {
            for (let i = 0; i < makerAccountInfo['assets'].length; i++) {
                if (makerAccountInfo['assets'][i]['asset-id'] === assetId) {
                    makerAlreadyOptedIntoASA = true;
                    break;
                }
            }
        }

        // let escrowAccountInfo = await this.getAccountInfo(lsig.address());

        // if (escrowAccountInfo != null && escrowAccountInfo['apps-local-state'] != null
        //         && escrowAccountInfo['apps-local-state'].length > 0
        //         && escrowAccountInfo['apps-local-state'][0].id == ALGO_ESCROW_ORDER_BOOK_ID) {
        //     alreadyOptedIntoOrderbook = true;
        // }

        console.debug({makerAlreadyOptedIntoASA});
        console.debug({alreadyOptedIntoOrderbook});

        if (alreadyOptedIntoOrderbook == false && algoOrderSize < constants.MIN_ASA_ESCROW_BALANCE) {
            algoOrderSize = constants.MIN_ASA_ESCROW_BALANCE;
        }
        console.debug("alreadyOptedIn: " + alreadyOptedIntoOrderbook);
        // console.debug("acct info:" + JSON.stringify(escrowAccountInfo));

        let params = await algodClient.getTransactionParams().do();
        console.debug("sending trans to: " + lsig.address());
        let txn = {
            ...params,
            type: 'pay',
            from: makerWalletAddr,
            to:  lsig.address(),
            amount: parseInt(algoOrderSize), // the order size that gets stored into the contract account
        };

        let outerTxns = [];

        outerTxns.push({
            unsignedTxn: txn,
            needsUserSig: true
        });

        myAlgoWalletUtil.setTransactionFee(txn);

        console.debug("here3 calling app from logic sig to open order");
        let appArgs = [];
        var enc = new TextEncoder();
        appArgs.push(enc.encode("open"));
        //console.debug("before slice: " + generatedOrderEntry);
        console.debug(generatedOrderEntry.slice(59));
        //console.debug("after slice: " + generatedOrderEntry.slice(59));

        appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
        //let arr = Uint8Array.from([0x2]);
        let arr = Uint8Array.from([constants.ESCROW_CONTRACT_VERSION]);
        appArgs.push(arr);
        console.debug("app args 2: " + arr);
        //console.debug("owners bit addr: " + ownersBitAddr);
        //console.debug("herezzz_888");
        console.debug(appArgs.length);
        let logSigTrans = null;

        if (!alreadyOptedIntoOrderbook) {
            logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig,
                    ALGO_ESCROW_ORDER_BOOK_ID, appArgs, "appOptIn", params);
            outerTxns.push({
                unsignedTxn: logSigTrans,
                needsUserSig: false,
                lsig: lsig
            });
        }
        // asset opt-in transfer
        let assetOptInTxn = null;

        if (!makerAlreadyOptedIntoASA) {
            assetOptInTxn = {
                type: "axfer",
                from: makerWalletAddr,
                to: makerWalletAddr,
                amount: 0,
                assetIndex: assetId,
                ...params
            };
            outerTxns.push({
                unsignedTxn: assetOptInTxn,
                needsUserSig: true
            });
        }

        unsignedTxns = [];
        for (let i = 0; i < outerTxns.length; i++) {
            unsignedTxns.push(outerTxns[i].unsignedTxn);
        }


        let noteMetadata = {
            algoBalance: makerAccountInfo.amount,
            asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
            assetId: assetId,
            n: n,
            d: d,
            escrowAddr: lsig.address(),
            orderEntry: generatedOrderEntry,
            escrowOrderType: "buy",
            version: constants.ESCROW_CONTRACT_VERSION
        }
        // look into accuracy of above object

        unsignedTxns = dexInternal.formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, "open", "algo")

        if (signAndSend) {
            if (!!walletConnector && walletConnector.connector.connected) {
                const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector);
                return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
            } else {
                const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(outerTxns);
                return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
                // When we remove the signing of LSIGS from the other functions the signing of LSIG functionality found in this function can be moved to the new myAlgoSign function
            }
        }


        if(!walletConnector || !walletConnector.connector.connected){this.assignGroups(unsignedTxns)};

        return outerTxns;
    },
    /**
     *
     * @param algodClient
     * @param isSellingASA
     * @param assetId
     * @param userWalletAddr
     * @param limitPrice
     * @param orderAssetAmount
     * @param orderAlgoAmount
     * @param allOrderBookOrders
     * @param includeMaker
     * @param walletConnector
     * @deprecated
     * @returns {Promise<undefined|*>}
     */
    executeMarketOrder :
        async function executeMarketOrder(algodClient, isSellingASA, assetId,
            userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker, walletConnector) {
                console.log("in Execute Market Order")
           return this.executeOrder(algodClient, isSellingASA, assetId,
            userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, includeMaker, walletConnector)
        },

    /**
     *
     * @param algodClient
     * @param makerWalletAddr
     * @param n
     * @param d
     * @param min
     * @param assetId
     * @param assetAmount
     * @param signAndSend
     * @param walletConnector
     * @returns {Promise<*[]|*>}
     * @deprecated
     */

    getPlaceASAToSellASAOrderIntoOrderbookV2:
        async function (algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, signAndSend, walletConnector) {
            console.debug("checking assetId type");
            assetId = parseInt(assetId + "");

            let outerTxns = [];

            let program = this.buildDelegateTemplateFromArgs(min, assetId, n, d, makerWalletAddr, true, constants.ESCROW_CONTRACT_VERSION);

            let lsig = await this.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
            let generatedOrderEntry = dexInternal.generateOrder(makerWalletAddr, n, d, min, assetId);
            console.debug("address is: " + lsig.address());

            let makerAccountInfo = await this.getAccountInfo(makerWalletAddr);
            // check if the lsig has already opted in
            let accountInfo = await this.getAccountInfo(lsig.address());
            let alreadyOptedIn = false;
            if (accountInfo != null && accountInfo['apps-local-state'] != null
                && accountInfo['apps-local-state'].length > 0
                && accountInfo['apps-local-state'][0].id == ASA_ESCROW_ORDER_BOOK_ID) {
                alreadyOptedIn = true;
            }
            console.debug("alreadyOptedIn: " + alreadyOptedIn);
            console.debug("acct info:" + JSON.stringify(accountInfo));

            let params = await algodClient.getTransactionParams().do();
            console.debug("sending trans to: " + lsig.address());

            let assetSendTrans = {
                ...params,
                fee: 1000,
                flatFee: true,
                type: 'axfer',
                assetIndex: assetId,
                from: makerWalletAddr,
                to: lsig.address(),
                amount: assetAmount
            };
            let noteMetadata = {
                algoBalance: makerAccountInfo.amount,
                asaBalance: (makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
                assetId: assetId,
                n: n,
                d: d,
                escrowAddr: accountInfo.address,
                orderEntry: generatedOrderEntry,
                escrowOrderType: "sell",
                version: constants.ESCROW_CONTRACT_VERSION
            }

            console.debug("herez88888 ", this.dumpVar(assetSendTrans));



            if (alreadyOptedIn) {
                outerTxns.push({
                    unsignedTxn: assetSendTrans,
                    needsUserSig: true
                });

                // Below Conditional is neccessarry for when an order is already open and the maker is just adding more asset value into it
                if (signAndSend) {
                    unsignedTxns = [];
                    for (let i = 0; i < outerTxns.length; i++) {
                        unsignedTxns.push(outerTxns[i].unsignedTxn);
                    }

                    unsignedTxns = dexInternal.formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, "open", "asa");
                    if (!!walletConnector && walletConnector.connector.connected) {
                        const signedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector);

                        return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
                    } else {
                        const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(outerTxns);
                        return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
                    }

                } else {
                    return outerTxns;
                }
            }

            let payTxn = {
                ...params,
                type: 'pay',
                from: makerWalletAddr,
                to: lsig.address(),
                amount: constants.MIN_ASA_ESCROW_BALANCE, //fund with enough to subtract from later
            };
            myAlgoWalletUtil.setTransactionFee(payTxn);

            console.debug("typeof: " + typeof payTxn.txId);
            console.debug("the val: " + payTxn.txId);

            let payTxId = payTxn.txId;
            //console.debug("confirmed!!");
            // create unsigned transaction

            console.debug("here3 calling app from logic sig to open order");
            let appArgs = [];
            var enc = new TextEncoder();
            appArgs.push(enc.encode("open"));
            console.debug("before slice: " + generatedOrderEntry);
            console.debug(generatedOrderEntry.slice(59));
            console.debug("after slice: " + generatedOrderEntry.slice(59));

            appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
            appArgs.push(new Uint8Array([constants.ESCROW_CONTRACT_VERSION]));

            // add owners address as arg
            //ownersAddr = "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI";
            //ownersBitAddr = (algosdk.decodeAddress(ownersAddr)).publicKey;
            console.debug(appArgs.length);

            let logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig,
                ASA_ESCROW_ORDER_BOOK_ID, appArgs, "appOptIn", params);

            // create optin transaction
            // sender and receiver are both the same
            let sender = lsig.address();
            let recipient = sender;
            // We set revocationTarget to undefined as
            // This is not a clawback operation
            let revocationTarget = undefined;
            // CloseReaminerTo is set to undefined as
            // we are not closing out an asset
            let closeRemainderTo = undefined;
            // We are sending 0 assets
            let amount = 0;

            // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
            let logSigAssetOptInTrans = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo,
                revocationTarget,
                amount, undefined, assetId, params);

            outerTxns.push({
                unsignedTxn: payTxn,
                needsUserSig: true
            });
            outerTxns.push({
                unsignedTxn: logSigTrans,
                needsUserSig: false,
                lsig: lsig
            });
            outerTxns.push({
                unsignedTxn: logSigAssetOptInTrans,
                needsUserSig: false,
                lsig: lsig
            });
            outerTxns.push({
                unsignedTxn: assetSendTrans,
                needsUserSig: true
            });

            unsignedTxns = [];
            for (let i = 0; i < outerTxns.length; i++) {
                unsignedTxns.push(outerTxns[i].unsignedTxn);
            }
            // Check if just coincidence that asa balance in question is Always at the top of the asset array, if it is then make function to filter relevant balance via assetId
            // Also look into modifying internal methods to have more consistent naming ex. (getAlgotoBuy and getAsaToSell would have same naming scheme of makerAccountInfo and EscrowAccountInfo)

            unsignedTxns = dexInternal.formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, "open", "asa")
            if (signAndSend) {
                if (!!walletConnector && walletConnector.connector.connected) {
                    const singedGroupedTransactions = await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector)
                    return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions)
                }
                const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(outerTxns);
                return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
            }

            return outerTxns;
        },

    /**
     *
     * @param algodClient
     * @param makerWalletAddr
     * @param n
     * @param d
     * @param min
     * @param assetId
     * @param assetAmount
     * @param signAndSend
     * @param walletConnector
     * @returns {Promise<*[]|*>}
     * @deprecated
     */
    getPlaceASAToSellASAOrderIntoOrderbook :
        async function getPlaceASAToSellASAOrderIntoOrderbook(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, signAndSend, walletConnector) {
        console.debug("checking assetId type");
        assetId = parseInt(assetId+"");

        let outerTxns = [];

        let program = this.buildDelegateTemplateFromArgs(min, assetId, n, d, makerWalletAddr, true, constants.ESCROW_CONTRACT_VERSION);

        let lsig = await this.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
        let generatedOrderEntry = dexInternal.generateOrder(makerWalletAddr, n, d, min, assetId);
        console.debug("address is: " + lsig.address());

        let makerAccountInfo = await this.getAccountInfo(makerWalletAddr);
        // check if the lsig has already opted in
        let accountInfo = await this.getAccountInfo(lsig.address());
        let alreadyOptedIn = false;
        if (accountInfo != null && accountInfo['apps-local-state'] != null
                && accountInfo['apps-local-state'].length > 0
                && accountInfo['apps-local-state'][0].id == ASA_ESCROW_ORDER_BOOK_ID) {
            alreadyOptedIn = true;
        }
        console.debug("alreadyOptedIn: " + alreadyOptedIn);
        console.debug("acct info:" + JSON.stringify(accountInfo));

        let params = await algodClient.getTransactionParams().do();
        console.debug("sending trans to: " + lsig.address());

        let assetSendTrans = {
            ...params,
            fee: 1000,
            flatFee: true,
            type: 'axfer',
            assetIndex: assetId,
            from: makerWalletAddr,
            to:  lsig.address(),
            amount: assetAmount
        };
        let noteMetadata = {
            algoBalance: makerAccountInfo.amount,
            asaBalance:(makerAccountInfo.assets && makerAccountInfo.assets.length > 0) ? makerAccountInfo.assets[0].amount : 0,
            assetId: assetId,
            n:n,
            d:d,
            escrowAddr: accountInfo.address,
            orderEntry: generatedOrderEntry,
            escrowOrderType:"sell",
            version: constants.ESCROW_CONTRACT_VERSION
         }

        console.debug("herez88888 ", this.dumpVar(assetSendTrans));



        if (alreadyOptedIn) {
            outerTxns.push({
                unsignedTxn: assetSendTrans,
                needsUserSig: true
            });

// Below Conditional is neccessarry for when an order is already open and the maker is just adding more asset value into it
            if (signAndSend) {
                unsignedTxns = [];
                for (let i = 0; i < outerTxns.length; i++) {
                    unsignedTxns.push(outerTxns[i].unsignedTxn);
                }

                unsignedTxns = dexInternal.formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, "open", "asa");
                if(!!walletConnector && walletConnector.connector.connected) {
                    const signedGroupedTransactions= await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector);

                    return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
                } else {
                    const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(outerTxns);
                    return await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
                }

            } else {
                return outerTxns;
            }
        }

        let payTxn = {
            ...params,
            type: 'pay',
            from: makerWalletAddr,
            to:  lsig.address(),
            amount: constants.MIN_ASA_ESCROW_BALANCE, //fund with enough to subtract from later
        };
        myAlgoWalletUtil.setTransactionFee(payTxn);

        console.debug("typeof: " + typeof payTxn.txId);
        console.debug("the val: " + payTxn.txId);

        let payTxId = payTxn.txId;
        //console.debug("confirmed!!");
        // create unsigned transaction

        console.debug("here3 calling app from logic sig to open order");
        let appArgs = [];
        var enc = new TextEncoder();
        appArgs.push(enc.encode("open"));
        console.debug("before slice: " + generatedOrderEntry);
        console.debug(generatedOrderEntry.slice(59));
        console.debug("after slice: " + generatedOrderEntry.slice(59));

        appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
        appArgs.push(new Uint8Array([constants.ESCROW_CONTRACT_VERSION]));

        // add owners address as arg
        //ownersAddr = "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI";
        //ownersBitAddr = (algosdk.decodeAddress(ownersAddr)).publicKey;
        console.debug(appArgs.length);

        let logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig,
                    ASA_ESCROW_ORDER_BOOK_ID, appArgs, "appOptIn", params);

        // create optin transaction
        // sender and receiver are both the same
        let sender = lsig.address();
        let recipient = sender;
        // We set revocationTarget to undefined as
        // This is not a clawback operation
        let revocationTarget = undefined;
        // CloseReaminerTo is set to undefined as
        // we are not closing out an asset
        let closeRemainderTo = undefined;
        // We are sending 0 assets
        let amount = 0;

        // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
        let logSigAssetOptInTrans = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo,
            revocationTarget,
            amount, undefined, assetId, params);

        outerTxns.push({
            unsignedTxn: payTxn,
            needsUserSig: true
        });
        outerTxns.push({
            unsignedTxn: logSigTrans,
            needsUserSig: false,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: logSigAssetOptInTrans,
            needsUserSig: false,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: assetSendTrans,
            needsUserSig: true
        });

        unsignedTxns = [];
        for (let i = 0; i < outerTxns.length; i++) {
            unsignedTxns.push(outerTxns[i].unsignedTxn);
        }
        // Check if just coincidence that asa balance in question is Always at the top of the asset array, if it is then make function to filter relevant balance via assetId
        // Also look into modifying internal methods to have more consistent naming ex. (getAlgotoBuy and getAsaToSell would have same naming scheme of makerAccountInfo and EscrowAccountInfo)

         unsignedTxns = dexInternal.formatTransactionsWithMetadata(unsignedTxns, makerWalletAddr, noteMetadata, "open", "asa")
         if (signAndSend) {
             if(!!walletConnector && walletConnector.connector.connected) {
                const singedGroupedTransactions= await signingApi.signWalletConnectTransactions(algodClient, outerTxns, params, walletConnector)
                return await signingApi.propogateTransactions(algodClient, singedGroupedTransactions)
             }
            return await this.signAndSendTransactions(algodClient, outerTxns);
        }

        if(!walletConnector || !walletConnector.connector.connected){this.assignGroups(unsignedTxns)};

        return outerTxns;
    },

/////////////////////////////////
// INTERNAL PASS-THRU FUNCTIONS /
/////////////////////////////////

    /**
     * @deprecated
     * @param signedTxns
     */
    printTransactionDebug : function printTransactionDebug(signedTxns) {
        return helperFuncs.printTransactionDebug(signedTxns);
    },

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
    buildDelegateTemplateFromArgs : function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version=3) {
        return dexInternal.buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version);
    },

    /**
     * @deprecated
     * @param algosdk
     * @param algodClient
     * @param program
     * @param logProgramSource
     * @returns {Promise<*>}
     */
    getLsigFromProgramSource : async function getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource) {
        return await dexInternal.getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource);
    },

    /**
     * @deprecated
     * @param accountAddr
     * @returns {Promise<*|{amount: number, address: *, 'apps-local-state': [], 'apps-total-schema': {'num-uint': number, 'num-byte-slice': number}, 'created-assets': [], 'pending-rewards': number, 'reward-base': number, 'created-apps': [], assets: [], round: number, 'amount-without-pending-rewards': number, rewards: number, status: string}|null|undefined>}
     */
    getAccountInfo : async function getAccountInfo(accountAddr) {
        return dexInternal.getAccountInfo(accountAddr);
    },


};
/**
 * Export of deprecated functions
 */
Object.keys(AlgodexApi).forEach(( key)=>{
    AlgodexApi[key] = deprecate(AlgodexApi[key], {file: 'algodex_api.js'})
})

module.exports = AlgodexApi;
