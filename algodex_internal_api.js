/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////


const http = require('http');
const algosdk = require('algosdk');

const BigN = require('js-big-decimal');
const TextEncoder = require("text-encoding").TextEncoder;
const axios = require('axios').default;

const LESS_THAN = -1;
const EQUAL = 0;
const GREATER_THAN = 1;

let MyAlgo = null;
let myAlgoWalletUtil = null;
if (typeof window != 'undefined') {
    MyAlgo = require('@randlabs/myalgo-connect');
    myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
}

const algoDelegateTemplate = require('./algo_delegate_template_teal.js');
const algoDelegateTemplateV4 = require('./algo_delegate_template_teal_v4.js');
const asaDelegateTemplate = require('./ASA_delegate_template_teal.js');
const asaDelegateTemplateV4 = require('./ASA_delegate_template_teal_v4.js');
//require('./dex_teal.js');

//FIXME - import below from algodex_api.js

let myAlgoWallet = null;
if (MyAlgo != null) {
    // console.debug("pointing to bridge URL");
    myAlgoWallet = new MyAlgo();
}
const constants = require('./constants.js');

let ALGO_ESCROW_ORDER_BOOK_ID = -1;
let ASA_ESCROW_ORDER_BOOK_ID = -1;
let ALGOD_SERVER = constants.TEST_ALGOD_SERVER;
let ALGOD_PORT = constants.TEST_ALGOD_PORT;
let ALGOD_TOKEN = constants.TEST_ALGOD_TOKEN;
let compilationResults = {};

const AlgodexInternalApi = {

    setAlgodServer : function (algod_server) {
        ALGOD_SERVER = algod_server;
    },
    setAlgodToken : function (algod_token) {
        ALGOD_TOKEN = algod_token;
    },
    setAlgodPort : function (algod_port) {
        ALGOD_PORT = algod_port;
    },

    doAlertInternal : function doAlertInternal() {
        alert(2);
        console.debug("internal api call!!!");
    },
    initSmartContracts : function initSmartContracts(algoOrderBookId, asaOrderBookId) {
        ALGO_ESCROW_ORDER_BOOK_ID = algoOrderBookId;
        ASA_ESCROW_ORDER_BOOK_ID = asaOrderBookId;
    },

    // call application 
    createTransactionFromLogicSig : async function createTransactionFromLogicSig(client, lsig, AppID, 
        appArgs, transType, params) {
        // define sender

        try {
            const sender = lsig.address();

            // get node suggested parameters
            if (params == null) {
                params = await client.getTransactionParams().do();
            }

            // create unsigned transaction
            let txn = null;
            if (transType == "appNoOp") {
                txn = algosdk.makeApplicationNoOpTxn(sender, params, AppID, appArgs)
            } else if (transType == "appOptIn") {
                txn = algosdk.makeApplicationOptInTxn(lsig.address(), params, AppID, appArgs);
            } 

            return txn;
        } catch (e) {
            throw e;
        }
    },
    // Generate order number
    generateOrder : function generateOrder(makerWalletAddr, N, D, min, assetId, includeMakerAddr=true) {
        let rtn = N + "-" + D + "-" + min + "-" + assetId;
        if (includeMakerAddr) {
            rtn = makerWalletAddr + "-" + rtn;
        }
        console.debug("generateOrder final str is: " + rtn);
        return rtn;
    },

    dumpVar : function dumpVar(x) {
        return JSON.stringify(x, null, 2);
    },
    getExecuteOrderTransactionsAsTakerFromOrderEntry : 
        async function getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient, orderBookEscrowEntry, 
          takerCombOrderBalance, params, walletConnector) {
            console.debug("looking at another orderbook entry to execute orderBookEscrowEntry: " + this.dumpVar(orderBookEscrowEntry));

            // rec contains the original order creators address
            let orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            let n = orderBookEscrowEntry['n'];
            let d = orderBookEscrowEntry['d'];
            let min = 0; //orders are set to 0 minimum for now
            let assetid = orderBookEscrowEntry['assetId'];

            let isASAEscrow = orderBookEscrowEntry['isASAEscrow'];

            let escrowSource = this.buildDelegateTemplateFromArgs(min,assetid,n,d,orderCreatorAddr, isASAEscrow, orderBookEscrowEntry['version']);
            const enableLsigLogging = constants.DEBUG_SMART_CONTRACT_SOURCE; // escrow logging 
            let lsig = await this.getLsigFromProgramSource(algosdk, algodClient, escrowSource,enableLsigLogging);
            if (!isASAEscrow) {
                console.debug("NOT asa escrow");
                return await this.getExecuteAlgoOrderTxnsAsTaker(orderBookEscrowEntry, algodClient
                    ,lsig, takerCombOrderBalance, params, walletConnector);
            } else {
                console.debug("asa escrow");
                return await this.getExecuteASAOrderTxns(orderBookEscrowEntry, algodClient, 
                    lsig, takerCombOrderBalance, params, walletConnector);
            }   
    },
// Helper function to get ASA Order Txns (3-4 transactions)
    getExecuteASAOrderTakerTxnAmounts(takerCombOrderBalance, orderBookEscrowEntry) {
        console.debug("printing!!!");
        console.debug({takerCombOrderBalance, orderBookEscrowEntry});

        const orderBookEntry = orderBookEscrowEntry['orderEntry'];
        const min_asa_balance = 0;

        // 1000000-250000-0-15322902
        // n-d-minOrderSize-assetId
        const orderBookEntrySplit = orderBookEntry.split("-");
        const n = orderBookEntrySplit[0];
        const d = orderBookEntrySplit[1];

        let escrowAsaTradeAmount = orderBookEscrowEntry['asaBalance'];
        const currentEscrowASABalance = orderBookEscrowEntry['asaBalance'];
        const price = new BigN(d).divide(new BigN(n), 30);
        const bDecOne = new BigN(1);
        const executionFees = 0.004 * 1000000;
        let closeoutFromASABalance = true;
        escrowAsaTradeAmount = new BigN(escrowAsaTradeAmount);
        let algoTradeAmount = price.multiply(escrowAsaTradeAmount);
        if (algoTradeAmount.getValue().includes('.')) {
            algoTradeAmount = algoTradeAmount.floor().add(bDecOne); //round up to give seller more money
        }
        //FIXME - check if lower than order balance
        const maxTradeAmount = Math.min(takerCombOrderBalance['algoBalance'], takerCombOrderBalance['walletAlgoBalance'] - executionFees);
        const emptyReturnVal = {
            'algoTradeAmount': 0,
            'escrowAsaTradeAmount': 0,
            'executionFees': 0,
            'closeoutFromASABalance': false
        }

        if (algoTradeAmount.compareTo(new BigN(maxTradeAmount)) == GREATER_THAN
                && algoTradeAmount.compareTo(bDecOne) == GREATER_THAN
                && algoTradeAmount.subtract(new BigN(maxTradeAmount)).compareTo(bDecOne) == GREATER_THAN) {

            console.debug("here999a reducing algoTradeAmount, currently at: " + algoTradeAmount.getValue()); 
            algoTradeAmount = new BigN(maxTradeAmount);
            escrowAsaTradeAmount = algoTradeAmount.divide(price);
            console.debug("checking max: " + escrowAsaTradeAmount.getValue() + " " + 1 );
            if (escrowAsaTradeAmount.compareTo(bDecOne) == LESS_THAN) { //don't allow 0 value
                escrowAsaTradeAmount = bDecOne;
            }
            console.debug("here999b reduced to algoTradeAmount escrowAsaAmount", algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());

            if (escrowAsaTradeAmount.getValue().includes('.')) {
                //round ASA amount
                escrowAsaTradeAmount = escrowAsaTradeAmount.floor();
                algoTradeAmount = price.multiply(escrowAsaTradeAmount);
                if (algoTradeAmount.getValue().includes('.')) {
                    algoTradeAmount = algoTradeAmount.floor().add(bDecOne); //round up to give seller more money
                    console.debug("here999bc increased algo to algoTradeAmount escrowAsaAmount", algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
                }
                console.debug("here999c changed to algoTradeAmount escrowAsaAmount", algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
            }
        } //FIXME: factor in fees?

        if (new BigN(currentEscrowASABalance).subtract(escrowAsaTradeAmount)
                .compareTo(new BigN(min_asa_balance)) == GREATER_THAN) {

            console.debug("asa escrow here9992 (currentASABalance - escrowAsaAmount) > min_asa_balance",
                    currentEscrowASABalance, escrowAsaTradeAmount.getValue(), min_asa_balance);
            closeoutFromASABalance = false;
        }

        if (takerCombOrderBalance['walletAlgoBalance'] < executionFees + parseInt(algoTradeAmount.getValue())) {
            console.debug("here9992b algo balance too low, returning early! ", executionFees, algoTradeAmount.getValue(), takerCombOrderBalance);
            return emptyReturnVal; //no balance left to use for buying ASAs
        }

        escrowAsaTradeAmount = parseInt(escrowAsaTradeAmount.getValue());
        algoTradeAmount = parseInt(algoTradeAmount.getValue());

        if (escrowAsaTradeAmount <= 0) {
            console.debug("here77zz escrowAsaTradeAmount is at 0 or below. returning early! nothing to do");
            return emptyReturnVal;
        }
        if (algoTradeAmount <= 0) {
            console.debug("here77zb algoTradeAmount is at 0 or below. returning early! nothing to do");
            return emptyReturnVal;
        }

        //FIXME - need more logic to transact correct price in case balances dont match order balances
        console.debug("closeoutFromASABalance: " + closeoutFromASABalance);

        console.debug("almost final amounts algoTradeAmount escrowAsaAmount ", algoTradeAmount, escrowAsaTradeAmount);
        //algoTradeAmount = algoTradeAmount / 2;

        console.debug("n: ", n, " d: ", d, " asset amount: " , escrowAsaTradeAmount);

        return {
            'algoTradeAmount': algoTradeAmount,
            'escrowAsaTradeAmount': escrowAsaTradeAmount,
            'executionFees': executionFees,
            'closeoutFromASABalance': closeoutFromASABalance
        }
    },

    getExecuteASAOrderTxns : async function getExecuteASAOrderTxns(orderBookEscrowEntry, algodClient, 
                lsig, takerCombOrderBalance, params, walletConnector) {
        console.debug("inside executeASAOrder!", this.dumpVar(takerCombOrderBalance));
        console.debug("orderBookEscrowEntry ", this.dumpVar(orderBookEscrowEntry));
        try {
            let retTxns = [];
            let appAccts = [];

            const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            const orderBookEntry = orderBookEscrowEntry['orderEntry'];
            const appId = ASA_ESCROW_ORDER_BOOK_ID;
            const takerAddr = takerCombOrderBalance['takerAddr'];

            const assetId = orderBookEscrowEntry['assetId'];

            appAccts.push(orderCreatorAddr);
            appAccts.push(takerAddr);
            
            let closeRemainderTo = undefined;

            const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution
            
            const {algoTradeAmount, escrowAsaTradeAmount, executionFees, 
                closeoutFromASABalance: initialCloseoutFromASABalance} = 
                    this.getExecuteASAOrderTakerTxnAmounts(takerCombOrderBalance, orderBookEscrowEntry);

            if (algoTradeAmount == 0) {
                console.debug("nothing to do, returning early");
                return null;
            }

            let closeoutFromASABalance = initialCloseoutFromASABalance;
            console.debug('closeoutFromASABalance here111: ' + closeoutFromASABalance);
            if (orderBookEscrowEntry.useForceShouldCloseOrNot) {
                closeoutFromASABalance = orderBookEscrowEntry.forceShouldClose;
                console.debug('closeoutFromASABalance here222: ' + closeoutFromASABalance);
            }

            takerCombOrderBalance['algoBalance'] -= executionFees;
            takerCombOrderBalance['algoBalance'] -= algoTradeAmount;
            takerCombOrderBalance['walletAlgoBalance'] -= executionFees;
            takerCombOrderBalance['walletAlgoBalance'] -= algoTradeAmount;

            takerCombOrderBalance['asaBalance'] += escrowAsaTradeAmount;
            takerCombOrderBalance['walletASABalance'] += escrowAsaTradeAmount;
            console.debug("ASA here110 algoAmount asaAmount txnFee takerOrderBalance: ", algoTradeAmount,
                        escrowAsaTradeAmount, executionFees, this.dumpVar(takerCombOrderBalance));

            console.debug("receiving ASA " + escrowAsaTradeAmount + " from  " + lsig.address());
            console.debug("sending ALGO amount " + algoTradeAmount + " to " + orderCreatorAddr);

            if (closeoutFromASABalance == true) {
                // only closeout if there are no more ASA in the account
                console.debug('closeoutFromASABalance here333: ' + closeoutFromASABalance);
                closeRemainderTo = orderCreatorAddr;
            }
            let transaction1 = null;
            let appCallType = null;

            if (closeRemainderTo == undefined) {
                appCallType = "execute";
            } else {
                appCallType = "execute_with_closeout";
            }

            let appArgs = [];
            var enc = new TextEncoder();
            appArgs.push(enc.encode(appCallType));
            appArgs.push(enc.encode(orderBookEntry));

            if (orderBookEscrowEntry.txnNum != null) {
                //uniquify this transaction even if this arg isn't used
                appArgs.push(enc.encode(orderBookEscrowEntry.txnNum));
            }

            // appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);
            //appArgs.push(enc.encode(assetId));

            console.debug(appArgs.length);

            if (closeRemainderTo == undefined) {
                transaction1 = algosdk.makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
            } else {
                transaction1 = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
            }
            console.debug("app call type is: " + appCallType);

            let fixedTxn2 = {
                type: 'pay',
                from: takerAddr,
                to:  orderCreatorAddr,
                amount: algoTradeAmount,
                ...params
            };

            const takerAlreadyOptedIntoASA = takerCombOrderBalance.takerIsOptedIn;
            console.debug({takerAlreadyOptedIntoASA});

            // asset opt-in transfer
            let transaction2b = null;

            if (!takerAlreadyOptedIntoASA) {
                transaction2b = {
                    type: "axfer",
                    from: takerAddr,
                    to: takerAddr,
                    amount: 0,
                    assetIndex: assetId,
                    ...params
                };
            }

            // Make asset xfer

            // Asset transfer from escrow account to order executor
            let transaction3 = algosdk.makeAssetTransferTxnWithSuggestedParams(lsig.address(), takerAddr, closeRemainderTo, undefined,
                escrowAsaTradeAmount, undefined, assetId, params);

               

            let transaction4 = null;
            if (closeRemainderTo != undefined) {
                // Make payment tx signed with lsig back to owner creator
                console.debug("making transaction4 due to closeRemainderTo");
                transaction4 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), orderCreatorAddr, 0, orderCreatorAddr, 
                    undefined, params);
            } else {
                // Make fee refund transaction
                transaction4 = {
                        type: 'pay',
                        from: takerAddr,
                        to:  lsig.address(),
                        amount: refundFees,
                        ...params
                };
            }
            
            myAlgoWalletUtil.setTransactionFee(fixedTxn2);

            if (transaction2b != null) {
                myAlgoWalletUtil.setTransactionFee(transaction2b);
            }

            let txns = [];
            txns.push(transaction1);
            txns.push(fixedTxn2);
            if (transaction2b != null) {
                console.debug("adding transaction2b due to asset not being opted in");
                txns.push(transaction2b);
            } else {
                console.debug("NOT adding transaction2b because already opted");
            }
            txns.push(transaction3);
            txns.push(transaction4);

       

            if (!!walletConnector && walletConnector.connector.connected) {
                retTxns.push({
                    'unsignedTxn': transaction1,
                    'lsig': lsig
                });
                retTxns.push({
                    'unsignedTxn': fixedTxn2,
                    'needsUserSig': true,
                    amount: fixedTxn2.amount,
                    txType: "algo",
                });

                if (transaction2b != null) {
                    retTxns.push({
                        'unsignedTxn': transaction2b,
                        'needsUserSig': true
                    });
                }
                retTxns.push({
                    'unsignedTxn': transaction3,
                    amount: escrowAsaTradeAmount,
                    txType: "asa",
                    'lsig': lsig
                });

                retTxns.push({
                    'unsignedTxn': transaction4,
                    'needsUserSig': true
                });


                return retTxns
               
            }
           
            // if (walletConnector) return retTxns
           

            //let txns = [transaction1, fixedTxn2, transaction2b, transaction3, transaction4 ];
           
            const groupID = algosdk.computeGroupID(txns);
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }
            
            let signedTx1 = algosdk.signLogicSigTransactionObject(transaction1, lsig);
            //let signedTx2 = await myAlgoWallet.signTransaction(fixedTxn2);
            let signedTx3 = algosdk.signLogicSigTransactionObject(transaction3, lsig);
            let signedTx4 = null;
            if (closeRemainderTo != undefined) {
                signedTx4 = algosdk.signLogicSigTransactionObject(transaction4, lsig);
            }

            retTxns.push({
                'signedTxn': signedTx1.blob,
            });
            retTxns.push({
                'unsignedTxn': fixedTxn2,
                'needsUserSig': true,
                amount: fixedTxn2.amount,
                txType: "algo",
            });
            
            if (transaction2b != null) {
                retTxns.push({
                    'unsignedTxn': transaction2b,
                    'needsUserSig': true
                });
            }
            retTxns.push({
                'signedTxn': signedTx3.blob,
                amount: escrowAsaTradeAmount,
                txType: "asa",
            });
            
            if (signedTx4 != null) {
                retTxns.push({
                    'signedTxn': signedTx4.blob,
                });
            } else {
                retTxns.push({
                    'unsignedTxn': transaction4,
                    'needsUserSig': true
                });
            }

            return retTxns;
        } catch (e) {
            console.debug(e);
            if (e.text != undefined) {
                alert(e.text);
            } else {
                alert(e);
            }
        }
    },

    getExecuteAlgoOrderTakerTxnAmounts(orderBookEscrowEntry, takerCombOrderBalance) {
            console.debug("orderBookEscrowEntry, takerCombOrderBalance",
                this.dumpVar(orderBookEscrowEntry),
                       this.dumpVar( takerCombOrderBalance) );

            const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            const orderBookEntry = orderBookEscrowEntry['orderEntry'];
            const currentEscrowAlgoBalance = orderBookEscrowEntry['algoBalance'];
            let algoAmountReceiving = orderBookEscrowEntry['algoBalance'];
            const assetId = orderBookEscrowEntry['assetId'];
            const takerAddr = takerCombOrderBalance['takerAddr'];

            console.debug("assetid: " + assetId);

            let orderBookEntrySplit = orderBookEntry.split("-");
            let n = orderBookEntrySplit[0];
            let d = orderBookEntrySplit[1];

            let appAccts = [];
            appAccts.push(orderCreatorAddr);
            appAccts.push(takerAddr);
            // Call stateful contract
            
            const txnFee = 0.002 * 1000000;

            algoAmountReceiving -= txnFee; // this will be the transfer amount
            console.debug("here1");
            console.debug("takerOrderBalance: " + this.dumpVar(takerCombOrderBalance));
            console.debug("algoAmount: " + algoAmountReceiving);
            
            const price = new BigN(d).divide(new BigN(n));
            const bDecOne = new BigN(1);

            const emptyReturnVal = {
                'algoAmountReceiving': 0,
                'asaAmountSending': 0,
                'txnFee': 0
            };

            if (algoAmountReceiving <= 0) {
                console.debug("here5");
                console.debug("can't afford, returning early");
                return emptyReturnVal; // can't afford any transaction!
            }
            algoAmountReceiving = new BigN(algoAmountReceiving);
            let asaAmount = algoAmountReceiving.divide(price, 30);
            console.debug("here6");
            console.debug("asa amount: " + asaAmount.getValue());

            let hasSpecialCaseOkPrice = false;
            if (asaAmount.getValue().includes('.') && 
                asaAmount.compareTo(bDecOne) == LESS_THAN) {
                // Since we can only sell at least one unit, figure out the 'real' price we are selling at,
                // since we will need to adjust upwards the ASA amount to 1, giving a worse deal for the seller (taker)
                let adjPrice = asaAmount.multiply(price);
                const takerLimitPrice = new BigN(takerCombOrderBalance['limitPrice']);
                console.debug("here6a2 figuring out adjusted price for hasSpecialCaseGoodPrice",
                        {adjPrice, asaAmount, price, takerLimitPrice});

                if (adjPrice.compareTo(takerLimitPrice) == GREATER_THAN) {
                    hasSpecialCaseOkPrice = true;
                }
            }

            if (asaAmount.getValue().includes('.') && 
                asaAmount.compareTo(bDecOne) == LESS_THAN && hasSpecialCaseOkPrice) {
                console.debug("here6aa asa less than one, changing ASA amount to 1");
                asaAmount = bDecOne;
                algoAmountReceiving = price.multiply(bDecOne);
                if (algoAmountReceiving.getValue().includes('.')) {
                    // give slightly worse deal for taker if decimal
                    algoAmountReceiving = algoAmountReceiving.floor();
                    console.debug("here6aa decreasing algoAmount due to decimal: " + algoAmountReceiving.getValue());
                }
                if (new BigN(currentEscrowAlgoBalance).compareTo(algoAmountReceiving) == LESS_THAN) {
                    algoAmountReceiving = new BigN(currentEscrowAlgoBalance);
                }

                algoAmountReceiving = algoAmountReceiving.subtract(new BigN(0.002 * 1000000)); // reduce for fees

            } else if (asaAmount.getValue().includes('.')) {
                // round down decimals. possibly change this later?
                asaAmount = asaAmount.floor();

                console.debug("here7");
                console.debug("increasing from decimal asa amount: " + asaAmount.getValue());

                // recalculating receiving amount
                // use math.floor to give slightly worse deal for taker
                algoAmountReceiving = asaAmount.multiply(price).floor();
                console.debug("recalculating receiving amount to: " + algoAmountReceiving.getValue());
            }

            if (new BigN(takerCombOrderBalance['asaBalance']).compareTo(asaAmount) == LESS_THAN) {
                console.debug("here8");
                console.debug("here8 reducing asa amount due to taker balance: ", asaAmount.getValue());
                asaAmount = new BigN(takerCombOrderBalance['asaBalance']);
                console.debug("here8 asa amount is now: ", asaAmount.getValue());

                algoAmountReceiving = price.multiply(asaAmount);
                console.debug("here9");
                console.debug("recalculating algoamount: " + algoAmountReceiving.getValue());
                if (algoAmountReceiving.getValue().includes('.')) {
                    // give slightly worse deal for taker if decimal
                    algoAmountReceiving = algoAmountReceiving.floor();
                    console.debug("here10 increasing algoAmount due to decimal: " + algoAmountReceiving.getValue());
                }
            }

            console.debug("almost final ASA amount: " + asaAmount.getValue());
            
            // These are expected to be integers now
            algoAmountReceiving = parseInt(algoAmountReceiving.getValue());
            asaAmount = parseInt(asaAmount.getValue());

            algoAmountReceiving = Math.max(0, algoAmountReceiving);

            return {
                'algoAmountReceiving': algoAmountReceiving,
                'asaAmountSending': asaAmount,
                'txnFee': txnFee
            }
    },

    // Helper function to execute the order (3 transactions)
    // escrowAsaAmount is not used currently
    getExecuteAlgoOrderTxnsAsTaker : 
        async function getExecuteAlgoOrderTxnsAsTaker(orderBookEscrowEntry, algodClient, lsig,
                    takerCombOrderBalance, params, walletConnector) {
        try {
            console.debug("in getExecuteAlgoOrderTxnsAsTaker");
            console.debug("orderBookEscrowEntry, algodClient, takerCombOrderBalance",
            this.dumpVar(orderBookEscrowEntry), algodClient,
                        takerCombOrderBalance);

            const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            const orderBookEntry = orderBookEscrowEntry['orderEntry'];
            const appId = ALGO_ESCROW_ORDER_BOOK_ID;
            const currentEscrowAlgoBalance = orderBookEscrowEntry['algoBalance'];
            const assetId = orderBookEscrowEntry['assetId'];
            const takerAddr = takerCombOrderBalance['takerAddr'];

            console.debug("assetid: " + assetId);

            let retTxns = [];
            let appArgs = [];
            var enc = new TextEncoder();

            let appAccts = [];
            appAccts.push(orderCreatorAddr);
            appAccts.push(takerAddr);
            // Call stateful contract

            let closeRemainderTo = undefined;
            const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

            const {algoAmountReceiving, asaAmountSending, txnFee} = 
                    this.getExecuteAlgoOrderTakerTxnAmounts(orderBookEscrowEntry, takerCombOrderBalance);

            if (algoAmountReceiving == 0) {
                console.debug("algoAmountReceiving is 0, nothing to do, returning early");
                return null;
            }

            takerCombOrderBalance['algoBalance'] -= txnFee;
            takerCombOrderBalance['algoBalance'] += algoAmountReceiving;
            takerCombOrderBalance['asaBalance'] -= asaAmountSending;
            console.debug("here11 algoAmount asaAmount txnFee takerOrderBalance: ", algoAmountReceiving,
                        asaAmountSending, txnFee, this.dumpVar(takerCombOrderBalance));

            console.debug("receiving " + algoAmountReceiving + " from  " + lsig.address());
            console.debug("sending ASA amount " + asaAmountSending + " to " + orderCreatorAddr);
            if (currentEscrowAlgoBalance - algoAmountReceiving < constants.MIN_ESCROW_BALANCE) {
                closeRemainderTo = orderCreatorAddr;
            }
            if (orderBookEscrowEntry.useForceShouldCloseOrNot) {
                if (orderBookEscrowEntry.forceShouldClose === true) {
                    closeRemainderTo = orderCreatorAddr;
                } else {
                    closeRemainderTo = undefined;
                }
            }
            let appCallType = null;
            if (closeRemainderTo == undefined) {
                appCallType = "execute";
            } else {
                appCallType = "execute_with_closeout";
            }
            console.debug("arg1: " + appCallType);
            console.debug("arg2: " + orderBookEntry);
            
            appArgs.push(enc.encode(appCallType));
            appArgs.push(enc.encode(orderBookEntry));
            if (orderBookEscrowEntry.txnNum != null) {
                //uniquify this transaction even if this arg isn't used
                appArgs.push(enc.encode(orderBookEscrowEntry.txnNum));
            }
            // appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);
            console.debug(appArgs.length);

            let transaction1 = null;

            if (closeRemainderTo == undefined) {
                transaction1 = algosdk.makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts);
            } else {
                transaction1 = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts);
            }

            // Make payment tx signed with lsig
            let transaction2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), takerAddr, algoAmountReceiving, closeRemainderTo, undefined, params);
            // Make asset xfer

            const transaction3 = {
                type: "axfer",
                from: takerAddr,
                to: orderCreatorAddr,
                amount: asaAmountSending,
                assetIndex: assetId,
                ...params
            };

            let transaction4 = null;

            if (closeRemainderTo == undefined) {
                // create refund transaction for fees
                transaction4 = {
                        type: 'pay',
                        from: takerAddr,
                        to:  lsig.address(),
                        amount: refundFees,
                        ...params
                };
            }

          //  delete fixedTxn1.note;
            delete transaction3.note;
            //delete fixedTxn1.lease;
            delete transaction3.lease;
            delete transaction3.appArgs;
            
            //myAlgoWalletUtil.setTransactionFee(fixedTxn1);
            myAlgoWalletUtil.setTransactionFee(transaction3);

            let txns = [transaction1, transaction2, transaction3];
            if (transaction4 != null) {
                txns.push(transaction4);
            }
            //algosdk.assignGroupID(txns);

            if (!!walletConnector && walletConnector.connector.connected) {
                retTxns.push({
                    'unsignedTxn': transaction1,
                    'lsig': lsig
                });
                retTxns.push({
                    'unsignedTxn': transaction2,
                    'amount': transaction2.amount,
                    'lsig': lsig,
                    'txType': "algo",
                });

               
                retTxns.push({
                    'unsignedTxn': transaction3,
                    'needsUserSig': true,
                    'amount': transaction3.amount,
                    'txType': "asa",
                    'lsig': lsig
                });

                retTxns.push({
                    'unsignedTxn': transaction4,
                    'needsUserSig': true
                });

                return retTxns
               
            }

            const groupID = algosdk.computeGroupID(txns);
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }

            let signedTx1 = algosdk.signLogicSigTransactionObject(txns[0], lsig);
            let signedTx2 = algosdk.signLogicSigTransactionObject(txns[1], lsig);

            retTxns.push({
                'signedTxn': signedTx1.blob,
            });
            retTxns.push({
                'signedTxn': signedTx2.blob,
                amount: transaction2.amount,
                txType: 'algo'
            
            });
            retTxns.push({
                'unsignedTxn': transaction3,
                'needsUserSig': true,
                txType: 'asa',
                amount: transaction3.amount
            
            });

            if (transaction4 != null) {
                retTxns.push({
                    'unsignedTxn': transaction4,
                    'needsUserSig': true
                });
            }

            return retTxns;
        } catch (e) {
            console.debug(e);
            if (e.text != undefined) {
                alert(e.text);
            } else {
                alert(e);
            }
        }
    },
    
    getQueuedTakerOrders : function getQueuedTakerOrders(takerWalletAddr, isSellingASA_AsTakerOrder, allOrderBookOrders) {
        console.debug("getQueuedTakerOrders order book list isSellingASA_AsTakerOrder: " + isSellingASA_AsTakerOrder);

        let queuedOrders = [];
        // getAllOrderBookEscrowOrders is UI dependant and needs to be customized for the React version

        if (allOrderBookOrders == null || allOrderBookOrders.length == 0) {
            return;
        }

        // FIXME: don't allow executions against own orders! check wallet address doesn't match
        // takerWalletAddr
        
        for (let i = 0; i < allOrderBookOrders.length; i++) {
            let orderBookEntry = allOrderBookOrders[i];

            if (orderBookEntry['escrowOrderType'] == 'buy' && !isSellingASA_AsTakerOrder) {
                // only look for sell orders in this case
                continue;
            }
            if (orderBookEntry['escrowOrderType'] == 'sell' && isSellingASA_AsTakerOrder) {
                // only look for buy orders in this case
                continue;
            }
            orderBookEntry.price = parseFloat(orderBookEntry.price);

            queuedOrders.push(orderBookEntry);
        }

        if (isSellingASA_AsTakerOrder) {
            // sort highest first (index 0) to lowest (last index)
            // these are buy orders, so we want to sell to the highest first
            queuedOrders.sort((a, b) => (a.price < b.price) ? 1 : (a.price === b.price) ? ((a.price < b.price) ? 1 : -1) : -1 )
        } else {
            // sort lowest first (index 0) to highest (last index)
            // these are sell orders, so we want to buy the lowest first
            queuedOrders.sort((a, b) => (a.price > b.price) ? 1 : (a.price === b.price) ? ((a.price > b.price) ? 1 : -1) : -1 )
        }

        //console.debug("queued orders: ", this.dumpVar(queuedOrders));
        return queuedOrders;
    },

    closeASAOrder : async function closeASAOrder(algodClient, escrowAddr, creatorAddr, index, appArgs, lsig, assetId) {
        console.debug("closing asa order!!!");

        try {
            // get node suggested parameters
            let params = await algodClient.getTransactionParams().do();

            // create unsigned transaction
            let txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, index, appArgs)
            let txId = txn.txID().toString();
            // Submit the transaction

            // create optin transaction
            // sender and receiver are both the same
            let sender = lsig.address();
            let recipient = creatorAddr;
            // We set revocationTarget to undefined as 
            // This is not a clawback operation
            let revocationTarget = undefined;
            // CloseReaminerTo is set to undefined as
            // we are not closing out an asset
            let closeRemainderTo = creatorAddr;
            // We are sending 0 assets
            let amount = 0;

            // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
            let txn2 = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, revocationTarget,
                amount, undefined, assetId, params);

            // Make payment tx signed with lsig
            let txn3 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), creatorAddr, 0, creatorAddr, 
                    undefined, params);

            let txn4 = {
                    type: 'pay',
                    from: creatorAddr,
                    to:  creatorAddr,
                    amount: 0,
                    ...params
                };

            let txns = [txn, txn2, txn3, txn4];
            const groupID = algosdk.computeGroupID(txns);
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }


            let signedTx = algosdk.signLogicSigTransactionObject(txn, lsig);
            txId = signedTx.txID;
            //console.debug("signedTxn:" + JSON.stringify(signedTx));
            console.debug("Signed transaction with txID: %s", txId);

            let signedTx2 = algosdk.signLogicSigTransactionObject(txn2, lsig);
            let txId2 = signedTx2.txID;
            //console.debug("signedTxn:" + JSON.stringify(signedTx));
            console.debug("Signed transaction with txID: %s", txId2);

            let signedTx3 = algosdk.signLogicSigTransactionObject(txn3, lsig);
            let txId3 = signedTx3.txID;
            //console.debug("signedTxn:" + JSON.stringify(signedTx));
            console.debug("Signed transaction3 with txID: %s", txId3);
            //this.printTransactionDebug([signedTx.blob]);

            let signedTx4 =  await myAlgoWallet.signTransaction(txn4);
            console.debug("zzsigned txn: " + signedTx4.txID);

            let signed = [];
            signed.push(signedTx.blob);
            signed.push(signedTx2.blob);
            signed.push(signedTx3.blob);
            signed.push(signedTx4.blob);
            this.printTransactionDebug(signed);

            //console.debug(Buffer.concat(signed.map(txn => Buffer.from(txn))).toString('base64'));
            let tx = await algodClient.sendRawTransaction(signed).do();
            console.debug(tx.txId);

            await this.waitForConfirmation(algodClient, tx.txId);

            // display results
            let transactionResponse = await algodClient.pendingTransactionInformation(tx.txId).do();
            console.debug("Called app-id:", transactionResponse['txn']['txn']['apid'])
            if (transactionResponse['global-state-delta'] !== undefined) {
                console.debug("Global State updated:", transactionResponse['global-state-delta']);
            }
            if (transactionResponse['local-state-delta'] !== undefined) {
                console.debug("Local State updated:", transactionResponse['local-state-delta']);
            }
        } catch (e) {
            throw e;
        }

        // The transaction has now been confirmed
        return;
    },
    getAccountInfo : async function getAccountInfo(accountAddr) {
        try {
            let port = (!!ALGOD_PORT) ? ':' + ALGOD_PORT : '';

            const response = await axios.get(ALGOD_SERVER + port +  "/v2/accounts/"+accountAddr, {headers: {'X-Algo-API-Token': ALGOD_TOKEN}});
            //console.debug(response);
            return response.data;
        } catch (error) {
            console.error(error);
            throw new Error("getAccountInfo failed: ", error);
        }
      
    },
    // close order 
    closeOrder : async function closeOrder(algodClient, escrowAddr, creatorAddr, appIndex, appArgs, lsig) {
        let accountInfo = await this.getAccountInfo(lsig.address());
        let alreadyOptedIn = false;
        if (accountInfo != null && accountInfo['assets'] != null
            && accountInfo['assets'].length > 0 && accountInfo['assets'][0] != null) {
            await closeASAOrder(algodClient, escrowAddr, creatorAddr, appIndex, appArgs, lsig);
            return;
        }


        try {
            // get node suggested parameters
            let params = await algodClient.getTransactionParams().do();

            // create unsigned transaction
            let txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, appIndex, appArgs)
            let txId = txn.txID().toString();
            // Submit the transaction

            // Make payment tx signed with lsig
            let txn2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), creatorAddr, 0, creatorAddr, undefined, params);
           
            let txn3 = {
                    type: 'pay',
                    from: creatorAddr,
                    to:  creatorAddr,
                    amount: 0,
                    ...params
                };

            myAlgoWalletUtil.setTransactionFee(txn3);

            let txns = [txn, txn2, txn3];
            const groupID = algosdk.computeGroupID(txns)
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }

            let signedTx = algosdk.signLogicSigTransactionObject(txn, lsig);
            txId = signedTx.txID;
            //console.debug("signedTxn:" + JSON.stringify(signedTx));
            console.debug("Signed transaction with txID: %s", txId);

            let signedTx2 = algosdk.signLogicSigTransactionObject(txn2, lsig);
            let txId2 = signedTx2.txID;
            //console.debug("signedTxn:" + JSON.stringify(signedTx));
            console.debug("Signed transaction with txID: %s", txId2);

            let signedTx3 =  await myAlgoWallet.signTransaction(txn3);
            console.debug("zzsigned txn: " + signedTx3.txID);

            //this.printTransactionDebug([signedTx.blob]);
        
            let signed = [];
            signed.push(signedTx.blob);
            signed.push(signedTx2.blob);
            signed.push(signedTx3.blob);
           
            this.printTransactionDebug(signed);

            //console.debug(Buffer.concat(signed.map(txn => Buffer.from(txn))).toString('base64'));
            let tx = await algodClient.sendRawTransaction(signed).do();
            console.debug(tx.txId);

            await this.waitForConfirmation(algodClient, tx.txId);

            // display results
            let transactionResponse = await algodClient.pendingTransactionInformation(tx.txId).do();
            console.debug("Called app-id:", transactionResponse['txn']['txn']['apid'])
            if (transactionResponse['global-state-delta'] !== undefined) {
                console.debug("Global State updated:", transactionResponse['global-state-delta']);
            }
            if (transactionResponse['local-state-delta'] !== undefined) {
                console.debug("Local State updated:", transactionResponse['local-state-delta']);
            }
        } catch (e) {
            throw e;
        }
    },

    // Wait for a transaction to be confirmed
    waitForConfirmation : async (algodClient, txId, numRoundTimeout = 4) => {
        const status = await algodClient.status().do();
        if (!status) {
            throw new Error("Unable to get node status");
        }

        const startingRound = status["last-round"];
        let nextRound = startingRound;

        while (nextRound < startingRound + numRoundTimeout) {
            // Check the pending transactions
            const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();

            if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
                // Got the completed Transaction
                console.debug(`Transaction ${txId} confirmed in round ${pendingInfo["confirmed-round"]}`);
                return {
                    txId,
                    status: "confirmed",
                    statusMsg: `Transaction confirmed in round ${pendingInfo["confirmed-round"]}`
                };
            }
            if (pendingInfo["pool-error"] !== null && pendingInfo["pool-error"].length > 0) {
                // transaction has been rejected
                throw new Error(pendingInfo["pool-error"]);
            }

            nextRound++;
            await algodClient.statusAfterBlock(nextRound).do();
        }

        throw new Error(`Transaction ${txId} timed out`);
    },

    // Check the status of pending transactions
    checkPending : async function(algodClient, txid, numRoundTimeout) {

        if (algodClient == null || txid == null || numRoundTimeout < 0) {
            throw "Bad arguments.";
        }
        let status = (await algodClient.status().do());
        if (status == undefined) throw "Unable to get node status";

        let startingRound = status["last-round"];
        let nextRound = startingRound;
        while (nextRound < startingRound + numRoundTimeout) {
            // Check the pending tranactions
            let pendingInfo = await algodClient.pendingTransactionInformation(txid).do();
            if (pendingInfo != undefined) {
                if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
                    //Got the completed Transaction
                    console.debug("Transaction " + txid + " confirmed in round " + pendingInfo["confirmed-round"]);
                    return pendingInfo;
                }
                if (pendingInfo["pool-error"] != null && pendingInfo["pool-error"].length > 0) {
                    // If there was a pool error, then the transaction has been rejected!
                    return "Transaction Rejected";
                }

            }
            nextRound++;
            await algodClient.statusAfterBlock(nextRound).do();
        }

        if (pendingInfo != null) {
            return "Transaction Still Pending";
        }

        return null;
    },

    printTransactionDebug : function printTransactionDebug(signedTxns) {
        console.debug('zzTxnGroup to debug:');
        const b64_encoded = Buffer.concat(signedTxns.map(txn => Buffer.from(txn))).toString('base64');

        console.debug(b64_encoded);
        //console.debug("DEBUG_SMART_CONTRACT_SOURCE: " + constants.DEBUG_SMART_CONTRACT_SOURCE);
        if (constants.DEBUG_SMART_CONTRACT_SOURCE == 1 && constants.INFO_SERVER != "") {
            (async() => {
                try {
                    console.debug("trying to inspect");
                    const response = await axios.post(constants.INFO_SERVER +  '/inspect/unpack', {
                    
                            msgpack: b64_encoded,
                            responseType: 'text/plain',
                        },
                    );
                    console.debug(response.data);
                    return response.data;
                } catch (error) {
                    console.error("Could not print out transaction details: " + error);
                }
            })();
        }
    },

    buildDelegateTemplateFromArgs : 
      function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow, version=3) {
        let orderBookId = null;
        if (isASAEscrow) {
            orderBookId = ASA_ESCROW_ORDER_BOOK_ID;
        } else {
            orderBookId = ALGO_ESCROW_ORDER_BOOK_ID;
        }

        // This is only used for test cases to override the app IDs. Possibly refactor.
        if (isASAEscrow && global.ASA_ESCROW_APP_ID != undefined) {
            orderBookId = global.ASA_ESCROW_APP_ID;
        } else if (!isASAEscrow && global.ALGO_ESCROW_APP_ID != undefined) {
            orderBookId = global.ALGO_ESCROW_APP_ID;
        }

        if (isNaN(min) || isNaN(assetid) || isNaN(N) || isNaN(D) || isNaN(orderBookId) ) {
            throw "one or more null arguments in buildDelegateTemplateFromArgs!";
            return null;
        }
        console.debug("here913 in buildDelegateTemplateFromArgs. min, assetid, N, D, writerAddr, isASAEscrow, orderbookId, version",
            min, assetid, N, D, writerAddr, isASAEscrow, orderBookId, version);
        let delegateTemplate = null;
        if (!isASAEscrow) {
            if (version == 4) {
                console.debug('not isASAEscrow, using version 4');
                delegateTemplate = algoDelegateTemplateV4.getTealTemplate();
            } else {
                console.debug('not isASAEscrow, using version 3');
                delegateTemplate = algoDelegateTemplate.getTealTemplate();
            }
        } else {
            if (version == 4) {
                console.debug('isASAEscrow, using version 4');
                delegateTemplate = asaDelegateTemplateV4.getTealTemplate();
            } else {
                console.debug('isASAEscrow, using version 3');
                delegateTemplate = asaDelegateTemplate.getTealTemplate();
            }
        }
        console.debug("min is: " + min);
        let res = delegateTemplate.split("<min>").join(min);
        res = res.split("<assetid>").join(assetid);
        res = res.split("<N>").join(N);
        res = res.split("<D>").join(D);
        res = res.split("<contractWriterAddr>").join(writerAddr);
        res = res.split("<orderBookId>").join(orderBookId);

        //console.debug(res);
        return res;

    },

    getLsigFromProgramSource : async function getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource) {
        if (logProgramSource) {
            console.debug("logging source!!");
            console.debug(program);
        }

        // Simple but effective hash function
        // https://stackoverflow.com/a/52171480
        const cyrb53 = function(str, seed = 0) {
            let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
            for (let i = 0, ch; i < str.length; i++) {
                ch = str.charCodeAt(i);
                h1 = Math.imul(h1 ^ ch, 2654435761);
                h2 = Math.imul(h2 ^ ch, 1597334677);
            }
            h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
            h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
            return 4294967296 * (2097151 & h2) + (h1>>>0);
        };

        const hashedProgram = cyrb53(program);
        console.debug("hashed program: " + hashedProgram);
        let compilationResult = null;
        if (hashedProgram in compilationResults) {
            compilationResult = compilationResults[hashedProgram];
            console.debug("got compilation results from hash! " + hashedProgram);
        } else {
            console.debug("program not found in cache, fetching");
            compilation = await this.compileProgram(algodClient, program);
            compilationResult = compilation.result;
            if (Object.keys(compilationResults).length > 200) {
                console.debug("size is too large! resetting keys");
                compilationResults = {};
            }
            compilationResults[hashedProgram] = compilationResult;
        }

        let uintAr = this._base64ToArrayBuffer(compilationResult);
        let args = undefined;
        let lsig = algosdk.makeLogicSig(uintAr, args);
        console.debug("lsig addr: " + lsig.address());
        return lsig;
    }, 

    // compile stateless delegate contract
    compileProgram : async function compileProgram(client, programSource) {
        let encoder = new TextEncoder();
        let programBytes = encoder.encode(programSource);
        let compileResponse = await client.compile(programBytes).do();
        return compileResponse;
    },

    // create array buffer from b64 string
    _base64ToArrayBuffer : function _base64ToArrayBuffer(b64) {
        var bytes = Buffer.from(b64, 'base64');
		return bytes;
        /*var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;*/
    }



}

module.exports = AlgodexInternalApi;
