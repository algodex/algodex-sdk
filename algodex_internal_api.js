/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const http = require('http');
const algosdk = require('algosdk');

const bigDecimal = require('js-big-decimal');
const TextEncoder = require("text-encoding").TextEncoder;
const axios = require('axios').default;

const LESS_THAN = -1;
const EQUAL = 0;
const GREATER_THAN = 1;

let MyAlgo = null;
if (typeof window != 'undefined') {
    MyAlgo = require('@randlabs/myalgo-connect');
}

const myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
const algoDelegateTemplate = require('./algo_delegate_template_teal.js');
const asaDelegateTemplate = require('./ASA_delegate_template_teal.js');
//require('./dex_teal.js');

//FIXME - import below from algodex_api.js

let myAlgoWallet = null;
if (MyAlgo != null) {
    // console.log("pointing to bridge URL");
    myAlgoWallet = new MyAlgo();
}
const constants = require('./constants.js');

let ALGO_ESCROW_ORDER_BOOK_ID = -1;
let ASA_ESCROW_ORDER_BOOK_ID = -1;


const AlgodexInternalApi = {
    doAlertInternal : function doAlertInternal() {
        alert(2);
        console.log("internal api call!!!");
    },
    initSmartContracts : function initSmartContracts(algoOrderBookId, asaOrderBookId) {
        ALGO_ESCROW_ORDER_BOOK_ID = algoOrderBookId;
        ASA_ESCROW_ORDER_BOOK_ID = asaOrderBookId;
    },

    // call application 
    createTransactionFromLogicSig : async function createTransactionFromLogicSig(client, lsig, AppID, appArgs, transType) {
        // define sender

        try {
            const sender = lsig.address();

            // get node suggested parameters
            const params = await client.getTransactionParams().do();

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
        console.log("generateOrder final str is: " + rtn);
        return rtn;
    },

    dumpVar : function dumpVar(x) {
        return JSON.stringify(x, null, 2);
    },
    getExecuteOrderTransactionsAsTakerFromOrderEntry : 
        async function getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient, orderBookEscrowEntry, takerCombOrderBalance) {
            console.log("looking at another orderbook entry to execute orderBookEscrowEntry: " + this.dumpVar(orderBookEscrowEntry));

            // rec contains the original order creators address
            let orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            let n = orderBookEscrowEntry['n'];
            let d = orderBookEscrowEntry['d'];
            let min = 0; //orders are set to 0 minimum for now
            let assetid = orderBookEscrowEntry['assetId'];

            let isASAEscrow = orderBookEscrowEntry['isASAEscrow'];

            let escrowSource = this.buildDelegateTemplateFromArgs(min,assetid,n,d,orderCreatorAddr, isASAEscrow);
            const enableLsigLogging = constants.DEBUG_SMART_CONTRACT_SOURCE; // escrow logging 
            let lsig = await this.getLsigFromProgramSource(algosdk, algodClient, escrowSource,enableLsigLogging);
            if (!isASAEscrow) {
                console.log("NOT asa escrow");
                return await this.getExecuteAlgoOrderTxnsAsTaker(orderBookEscrowEntry, algodClient
                    ,lsig, takerCombOrderBalance);
            } else {
                console.log("asa escrow");
                return await this.getExecuteASAOrderTxns(orderBookEscrowEntry, algodClient, 
                    lsig, takerCombOrderBalance);
            }   
    },
// Helper function to get ASA Order Txns (3-4 transactions)

    getExecuteASAOrderTxns : async function getExecuteASAOrderTxns(orderBookEscrowEntry, algodClient, 
                lsig, takerCombOrderBalance) {
        console.log("inside executeASAOrder!", this.dumpVar(takerCombOrderBalance));
        console.log("orderBookEscrowEntry ", this.dumpVar(orderBookEscrowEntry));
        try {
            let retTxns = [];
            let params = await algodClient.getTransactionParams().do();
            let appAccts = [];

            const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            const orderBookEntry = orderBookEscrowEntry['orderEntry'];
            const appId = ASA_ESCROW_ORDER_BOOK_ID;
            const takerAddr = takerCombOrderBalance['takerAddr'];
            let escrowAsaTradeAmount = orderBookEscrowEntry['asaBalance'];
            let escrowAlgoAmount = orderBookEscrowEntry['algoBalance'];
            const currentEscrowBalance = escrowAlgoAmount;
            const currentEscrowASABalance = orderBookEscrowEntry['asaBalance'];
            const assetId = orderBookEscrowEntry['assetId'];

            appAccts.push(orderCreatorAddr);
            appAccts.push(takerAddr);

            
            // 1000000-250000-0-15322902
            // n-d-minOrderSize-assetId
            const orderBookEntrySplit = orderBookEntry.split("-");
            const n = orderBookEntrySplit[0];
            const d = orderBookEntrySplit[1];
            console.log("n: ", n, " d: ", d, " asset amount: " , escrowAsaTradeAmount);
            
            let closeRemainderTo = undefined;

            let closeoutFromASABalance = true;
            const min_asa_balance = 0;

            let executionFees = 0.004 * 1000000;
            const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution
            const price = new bigDecimal(d).divide(new bigDecimal(n), 30);
            const bDecOne = new bigDecimal(1);

            escrowAsaTradeAmount = new bigDecimal(escrowAsaTradeAmount);
            let algoTradeAmount = price.multiply(escrowAsaTradeAmount);
            if (algoTradeAmount.getValue().includes('.')) {
                algoTradeAmount = algoTradeAmount.floor().add(bDecOne); //round up to give seller more money
            }
            //FIXME - check if lower than order balance
            if (algoTradeAmount.compareTo(new bigDecimal(takerCombOrderBalance['algoBalance'])) == GREATER_THAN
                 && algoTradeAmount.compareTo(bDecOne) == GREATER_THAN
                 && algoTradeAmount.subtract(new bigDecimal(takerCombOrderBalance['algoBalance'])).compareTo(bDecOne) == GREATER_THAN) {

                console.log("here999a reducing algoTradeAmount, currently at: " + algoTradeAmount.getValue()); 
                algoTradeAmount = new bigDecimal(Math.floor(takerCombOrderBalance['algoBalance']));
                escrowAsaTradeAmount = algoTradeAmount.divide(price);
                console.log("checking max: " + escrowAsaTradeAmount.getValue() + " " + 1 );
                if (escrowAsaTradeAmount.compareTo(bDecOne) == LESS_THAN) { //don't allow 0 value
                    escrowAsaTradeAmount = bDecOne;
                }
                console.log("here999b reduced to algoTradeAmount escrowAsaAmount", algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());

                if (escrowAsaTradeAmount.getValue().includes('.')) {
                    //round ASA amount
                    escrowAsaTradeAmount = escrowAsaTradeAmount.round();
                    algoTradeAmount = price.multiply(escrowAsaTradeAmount);
                    if (algoTradeAmount.getValue().includes('.')) {
                        algoTradeAmount = algoTradeAmount.floor().add(bDecOne); //round up to give seller more money
                        console.log("here999bc increased algo to algoTradeAmount escrowAsaAmount", algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
                    }
                    console.log("here999c changed to algoTradeAmount escrowAsaAmount", algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
                
                    if (takerCombOrderBalance['walletAlgoBalance'] < executionFees + parseInt(algoTradeAmount.getValue())) {
                        console.log("here999d wallet balance not enough! ", takerCombOrderBalance['walletAlgoBalance'], 
                            executionFees, parseInt(algoTradeAmount.getValue()));

                        algoTradeAmount = new bigDecimal(takerCombOrderBalance['walletAlgoBalance'])
                            .subtract(new bigDecimal(executionFees));
                      
                        escrowAsaTradeAmount = algoTradeAmount.divide(price);

                        console.log("here999da wallet balance not enough! takerCombOrderBalance['walletAlgoBalance'] executionFees, parseInt(algoTradeAmount.getValue()), escrowAsaAmount", takerCombOrderBalance['walletAlgoBalance'], 
                            executionFees, parseInt(algoTradeAmount.getValue()), escrowAsaTradeAmount);

                        if (escrowAsaTradeAmount.getValue().includes('.')) {
                            // give slightly better deal to the maker
                            console.log("here999e rounding down escrowAsaAmount from ", escrowAsaTradeAmount.getValue());
                            escrowAsaTradeAmount = escrowAsaTradeAmount.floor();
                        }
                        console.log("here999f balances are now", takerCombOrderBalance['walletAlgoBalance'], 
                            executionFees, algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
                    }
                }
            } //FIXME: factor in fees


            // TODO: section below not needed?
            /*if (new bigDecimal(takerCombOrderBalance['asaBalance']).compareTo(escrowAsaTradeAmount) == LESS_THAN) {
                console.log("asa escrow here9991 takerCombOrderBalance['asaBalance'] < escrowAsaAmount",
                        takerCombOrderBalance['asaBalance'], escrowAsaTradeAmount.getValue());
                escrowAsaTradeAmount = new bigDecimal(takerCombOrderBalance['asaBalance']);
                algoTradeAmount = price.multiply(escrowAsaTradeAmount);
                if (algoTradeAmount.getValue().includes('.')) {
                    algoTradeAmount = algoTradeAmount.floor().add(bDecOne); //round up to give seller more money
                }
            }*/

            if (new bigDecimal(currentEscrowASABalance).subtract(escrowAsaTradeAmount)
                    .compareTo(new bigDecimal(min_asa_balance)) == GREATER_THAN) {

                console.log("asa escrow here9992 (currentASABalance - escrowAsaAmount) > min_asa_balance",
                        currentEscrowASABalance, escrowAsaTradeAmount.getValue(), min_asa_balance);
                closeoutFromASABalance = false;
            }

            if (takerCombOrderBalance['walletAlgoBalance'] < executionFees + parseInt(algoTradeAmount.getValue())) {
               console.log("asa escrow here9992b balance too low, returning early! ", executionFees, algoTradeAmount.getValue(), takerCombOrderBalance);
               return; //no balance left to use for buying ASAs
            }

            escrowAsaTradeAmount = parseInt(escrowAsaTradeAmount.getValue());
            algoTradeAmount = parseInt(algoTradeAmount.getValue());

            if (escrowAsaTradeAmount <= 0) {
                console.log("here77zz escrowAsaTradeAmount is at 0 or below. returning early! nothing to do");
                return;
            }
            if (algoTradeAmount <= 0) {
                console.log("here77zb algoTradeAmount is at 0 or below. returning early! nothing to do");
                return;
            }

            //FIXME - need more logic to transact correct price in case balances dont match order balances
            console.log("closeoutFromASABalance: " + closeoutFromASABalance);

            console.log("almost final amounts algoTradeAmount escrowAsaAmount ", algoTradeAmount, escrowAsaTradeAmount);
            //algoTradeAmount = algoTradeAmount / 2;

            takerCombOrderBalance['algoBalance'] -= executionFees;
            takerCombOrderBalance['algoBalance'] -= algoTradeAmount;
            takerCombOrderBalance['walletAlgoBalance'] -= executionFees;
            takerCombOrderBalance['walletAlgoBalance'] -= algoTradeAmount;

            takerCombOrderBalance['asaBalance'] += escrowAsaTradeAmount;
            takerCombOrderBalance['walletASABalance'] += escrowAsaTradeAmount;
            console.log("ASA here110 algoAmount asaAmount txnFee takerOrderBalance: ", algoTradeAmount,
                        escrowAsaTradeAmount, executionFees, this.dumpVar(takerCombOrderBalance));

            console.log("receiving ASA " + escrowAsaTradeAmount + " from  " + lsig.address());
            console.log("sending ALGO amount " + algoTradeAmount + " to " + orderCreatorAddr);

            if (closeoutFromASABalance == true) {
                // only closeout if there are no more ASA in the account
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
            appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);
            //appArgs.push(enc.encode(assetId));

            console.log(appArgs.length);

            if (closeRemainderTo == undefined) {
                transaction1 = algosdk.makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
            } else {
                transaction1 = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
            }
            console.log("app call type is: " + appCallType);

            let fixedTxn2 = {
                type: 'pay',
                from: takerAddr,
                to:  orderCreatorAddr,
                amount: algoTradeAmount,
                ...params
            };

            let accountInfo = await this.getAccountInfo(takerAddr);
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
                console.log("making transaction4 due to closeRemainderTo");
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
                console.log("adding transaction2b due to asset not being opted in");
                txns.push(transaction2b);
            } else {
                console.log("NOT adding transaction2b because already opted");
            }
            txns.push(transaction3);
            txns.push(transaction4);

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
                'needsUserSig': true
            });

            if (transaction2b != null) {
                retTxns.push({
                    'unsignedTxn': transaction2b,
                    'needsUserSig': true
                });
            }
            retTxns.push({
                'signedTxn': signedTx3.blob,
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
            console.log(e);
            if (e.text != undefined) {
                alert(e.text);
            } else {
                alert(e);
            }
        }
    },

    // Helper function to execute the order (3 transactions)
    // escrowAsaAmount is not used currently
    getExecuteAlgoOrderTxnsAsTaker : 
        async function getExecuteAlgoOrderTxnsAsTaker(orderBookEscrowEntry, algodClient, lsig,
                    takerCombOrderBalance) {
        try {
            console.log("orderBookEscrowEntry, algodClient, takerCombOrderBalance",
                this.dumpVar(orderBookEscrowEntry), algodClient,
                        takerCombOrderBalance);

            const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            const orderBookEntry = orderBookEscrowEntry['orderEntry'];
            const appId = ALGO_ESCROW_ORDER_BOOK_ID;
            let escrowAsaAmount = orderBookEscrowEntry['asaBalance'];
            const currentEscrowAlgoBalance = orderBookEscrowEntry['algoBalance'];
            let algoAmountReceiving = orderBookEscrowEntry['algoBalance'];
            const assetId = orderBookEscrowEntry['assetId'];
            const takerAddr = takerCombOrderBalance['takerAddr'];

            console.log("assetid: " + assetId);

            let retTxns = [];
            let appArgs = [];
            var enc = new TextEncoder();

            let orderBookEntrySplit = orderBookEntry.split("-");
            let n = orderBookEntrySplit[0];
            let d = orderBookEntrySplit[1];

            let params = await algodClient.getTransactionParams().do();
            let appAccts = [];
            appAccts.push(orderCreatorAddr);
            appAccts.push(takerAddr);
            // Call stateful contract
            
            //let escrowAccountInfo = await this.getAccountInfo(lsig.address()); //FIXME - load from order book cache not from here
            //let currentEscrowBalance = escrowAlgoAmount;
            let closeRemainderTo = undefined;
            const txnFee = 0.004 * 1000000; //FIXME - make more accurate
            const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

            algoAmountReceiving -= txnFee; // this will be the transfer amount
            console.log("here1");
            console.log("takerOrderBalance: " + this.dumpVar(takerCombOrderBalance));
            console.log("algoAmount: " + algoAmountReceiving);
            
            const price = new bigDecimal(d).divide(new bigDecimal(n));
            

            if (takerCombOrderBalance['algoBalance'] < algoAmountReceiving + txnFee) {
                algoAmountReceiving = Math.floor(takerCombOrderBalance['algoBalance']);

                console.log("here3z");
                console.log("reducing algoAmount to " + algoAmountReceiving);
            }
            if (algoAmountReceiving - txnFee < 0) {
                //dont allow overspend from user's wallet
                console.log("here4");
                console.log("returning early from overspend");
                return null;
            }

            if (algoAmountReceiving <= 0) {
                console.log("here5");
                console.log("can't afford, returning early");
                return null; // can't afford any transaction!
            }
            algoAmountReceiving = new bigDecimal(algoAmountReceiving);
            let asaAmount = algoAmountReceiving.divide(price, 30);
            console.log("here6");
            console.log("asa amount: " + asaAmount.getValue());

            if (asaAmount.getValue().includes('.')) {
                // round down decimals. possibly change this later?
                asaAmount = asaAmount.floor();

                console.log("here7");
                console.log("increasing from decimal asa amount: " + asaAmount.getValue());

                // recalculating receiving amount
                // use math.floor to give slightly worse deal for taker
                algoAmountReceiving = asaAmount.multiply(price).floor();
                console.log("recalculating receiving amount to: " + algoAmountReceiving.getValue());
            }

            if (new bigDecimal(takerCombOrderBalance['asaBalance']).compareTo(asaAmount) == LESS_THAN) {
                console.log("here8");
                console.log("here8 reducing asa amount due to taker balance: ", asaAmount.getValue());
                asaAmount = new bigDecimal(takerCombOrderBalance['asaBalance']);
                console.log("here8 asa amount is now: ", asaAmount.getValue());

                algoAmountReceiving = price.multiply(asaAmount);
                console.log("here9");
                console.log("recalculating algoamount: " + algoAmountReceiving.getValue());
                if (algoAmountReceiving.getValue().includes('.')) {
                    // give slightly worse deal for taker if decimal
                    algoAmountReceiving = algoAmountReceiving.floor();
                    console.log("here10 increasing algoAmount due to decimal: " + algoAmountReceiving.getValue());
                }
            }

            //asaAmount = 3; //Set this to 3 (a low amount) to test breaking inequality in smart contract
            console.log("almost final ASA amount: " + asaAmount.getValue());
            //asaAmount = asaAmount / 2;
            //console.log("dividing asaAmount / 2: " + asaAmount);
            
            // These are expected to be integers now
            algoAmountReceiving = parseInt(algoAmountReceiving.getValue());
            asaAmount = parseInt(asaAmount.getValue());

            if (algoAmountReceiving == 0) {
                console.log("algoAmountReceiving == 0. Nothing to do, so return early.");
                return;
            }
            takerCombOrderBalance['algoBalance'] -= txnFee;
            takerCombOrderBalance['algoBalance'] += algoAmountReceiving;
            takerCombOrderBalance['asaBalance'] -= asaAmount;
            console.log("here11 algoAmount asaAmount txnFee takerOrderBalance: ", algoAmountReceiving,
                        asaAmount, txnFee, this.dumpVar(takerCombOrderBalance));

            console.log("receiving " + algoAmountReceiving + " from  " + lsig.address());
            console.log("sending ASA amount " + asaAmount + " to " + orderCreatorAddr);
            if (currentEscrowAlgoBalance - algoAmountReceiving < constants.MIN_ESCROW_BALANCE) {
                closeRemainderTo = orderCreatorAddr;
            }

            let appCallType = null;
            if (closeRemainderTo == undefined) {
                appCallType = "execute";
            } else {
                appCallType = "execute_with_closeout";
            }
            console.log("arg1: " + appCallType);
            console.log("arg2: " + orderBookEntry);
            console.log("arg3: " + orderCreatorAddr);
            
            appArgs.push(enc.encode(appCallType));
            appArgs.push(enc.encode(orderBookEntry));
            appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);
            console.log(appArgs.length);

            let transaction1 = null;

            if (closeRemainderTo == undefined) {
                transaction1 = algosdk.makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts);
            } else {
                transaction1 = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts);
            }


            // Make payment tx signed with lsig
            let transaction2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), takerAddr, algoAmountReceiving, closeRemainderTo, undefined, params);
            // Make asset xfer
           // let transaction3 = algosdk.makeAssetTransferTxnWithSuggestedParams(orderExecutor.addr, orderCreatorAddr, undefined, undefined,
            //    assetamount, undefined, assetId, params);
            //const fixedTxn3 = { ...JSON.parse(transaction3.toString()) };   

            const transaction3 = {
                type: "axfer",
                from: takerAddr,
                to: orderCreatorAddr,
                amount: asaAmount,
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

            const groupID = algosdk.computeGroupID(txns);
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }

            let signedTx1 = algosdk.signLogicSigTransactionObject(txns[0], lsig);
            let signedTx2 = algosdk.signLogicSigTransactionObject(txns[1], lsig);

      

            // let signedTx3 = await myAlgoWallet.signTransaction(fixedTxn3);

            retTxns.push({
                'signedTxn': signedTx1.blob,
            });
            retTxns.push({
                'signedTxn': signedTx2.blob,
            });
            retTxns.push({
                'unsignedTxn': transaction3,
                'needsUserSig': true
            });

            if (transaction4 != null) {
                retTxns.push({
                    'unsignedTxn': transaction4,
                    'needsUserSig': true
                });
            }

            return retTxns;
        } catch (e) {
            console.log(e);
            if (e.text != undefined) {
                alert(e.text);
            } else {
                alert(e);
            }
        }
    },
    
    getQueuedTakerOrders : function getQueuedTakerOrders(takerWalletAddr, isSellingASA_AsTakerOrder, allOrderBookOrders) {
        console.log("getQueuedTakerOrders order book list isSellingASA_AsTakerOrder: " + isSellingASA_AsTakerOrder);

        let queuedOrders = [];
        // getAllOrderBookEscrowOrders is UI dependant and needs to be customized for the React version

        if (allOrderBookOrders == null || allOrderBookOrders.length == 0) {
            return;
        }

        // FIXME: don't allow executions against own orders! check wallet address doesn't match
        // takerWalletAddr
        for (let i = 0; i < allOrderBookOrders.length; i++) {
            let orderBookEntry = allOrderBookOrders[i];
            //console.log("orderBookEntry: ", this.dumpVar(orderBookEntry) );

            if (orderBookEntry['escrowOrderType'] == 'buy' && !isSellingASA_AsTakerOrder) {
                // only look for sell orders in this case
                continue;
            }
            if (orderBookEntry['escrowOrderType'] == 'sell' && isSellingASA_AsTakerOrder) {
                // only look for buy orders in this case
                continue;
            }
        
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

        //console.log("queued orders: ", this.dumpVar(queuedOrders));
        return queuedOrders;
    },

    closeASAOrder : async function closeASAOrder(algodClient, escrowAddr, creatorAddr, index, appArgs, lsig, assetId) {
        console.log("closing asa order!!!");

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
            //console.log("signedTxn:" + JSON.stringify(signedTx));
            console.log("Signed transaction with txID: %s", txId);

            let signedTx2 = algosdk.signLogicSigTransactionObject(txn2, lsig);
            let txId2 = signedTx2.txID;
            //console.log("signedTxn:" + JSON.stringify(signedTx));
            console.log("Signed transaction with txID: %s", txId2);

            let signedTx3 = algosdk.signLogicSigTransactionObject(txn3, lsig);
            let txId3 = signedTx3.txID;
            //console.log("signedTxn:" + JSON.stringify(signedTx));
            console.log("Signed transaction3 with txID: %s", txId3);
            //this.printTransactionDebug([signedTx.blob]);

            let signedTx4 =  await myAlgoWallet.signTransaction(txn4);
            console.log("zzsigned txn: " + signedTx4.txID);

            let signed = [];
            signed.push(signedTx.blob);
            signed.push(signedTx2.blob);
            signed.push(signedTx3.blob);
            signed.push(signedTx4.blob);
            this.printTransactionDebug(signed);

            //console.log(Buffer.concat(signed.map(txn => Buffer.from(txn))).toString('base64'));
            let tx = await algodClient.sendRawTransaction(signed).do();
            console.log(tx.txId);

            await this.waitForConfirmation(algodClient, tx.txId);

            // display results
            let transactionResponse = await algodClient.pendingTransactionInformation(tx.txId).do();
            console.log("Called app-id:", transactionResponse['txn']['txn']['apid'])
            if (transactionResponse['global-state-delta'] !== undefined) {
                console.log("Global State updated:", transactionResponse['global-state-delta']);
            }
            if (transactionResponse['local-state-delta'] !== undefined) {
                console.log("Local State updated:", transactionResponse['local-state-delta']);
            }
        } catch (e) {
            throw e;
        }

        // The transaction has now been confirmed
        return;
    },
    getAccountInfo : async function getAccountInfo(accountAddr) {
        // "https://testnet.algoexplorerapi.io/v2/accounts/"+accountAddr
        try {
            const response = await axios.get(constants.TEST_ALGOD_SERVER + "/v2/accounts/"+accountAddr);
            //console.log(response);
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
            //console.log("signedTxn:" + JSON.stringify(signedTx));
            console.log("Signed transaction with txID: %s", txId);

            let signedTx2 = algosdk.signLogicSigTransactionObject(txn2, lsig);
            let txId2 = signedTx2.txID;
            //console.log("signedTxn:" + JSON.stringify(signedTx));
            console.log("Signed transaction with txID: %s", txId2);

            let signedTx3 =  await myAlgoWallet.signTransaction(txn3);
            console.log("zzsigned txn: " + signedTx3.txID);

            //this.printTransactionDebug([signedTx.blob]);
        
            let signed = [];
            signed.push(signedTx.blob);
            signed.push(signedTx2.blob);
            signed.push(signedTx3.blob);
           
            this.printTransactionDebug(signed);

            //console.log(Buffer.concat(signed.map(txn => Buffer.from(txn))).toString('base64'));
            let tx = await algodClient.sendRawTransaction(signed).do();
            console.log(tx.txId);

            await this.waitForConfirmation(algodClient, tx.txId);

            // display results
            let transactionResponse = await algodClient.pendingTransactionInformation(tx.txId).do();
            console.log("Called app-id:", transactionResponse['txn']['txn']['apid'])
            if (transactionResponse['global-state-delta'] !== undefined) {
                console.log("Global State updated:", transactionResponse['global-state-delta']);
            }
            if (transactionResponse['local-state-delta'] !== undefined) {
                console.log("Local State updated:", transactionResponse['local-state-delta']);
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
                console.log(`Transaction ${txId} confirmed in round ${pendingInfo["confirmed-round"]}`);
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
                    console.log("Transaction " + txid + " confirmed in round " + pendingInfo["confirmed-round"]);
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
        console.log('zzTxnGroup to debug:');
        const b64_encoded = Buffer.concat(signedTxns.map(txn => Buffer.from(txn))).toString('base64');

        console.log(b64_encoded);
        if (constants.DEBUG_SMART_CONTRACT_SOURCE) {
            (async() => {
                try {
                    console.log("trying to inspect");
                    const response = await axios.post('http://localhost:8000/inspect', {
                    
                            msgpack: b64_encoded,
                            responseType: 'text/plain',
                        },
                    );
                    console.log(response.data);
                    return response.data;
                } catch (error) {
                    console.error("Could not print out transaction details: " + error);
                }
            })();
        }
    },

    buildDelegateTemplateFromArgs : 
      function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow) {
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
        console.log("here913 in buildDelegateTemplateFromArgs. min, assetid, N, D, writerAddr, isASAEscrow, orderbookId",
            min, assetid, N, D, writerAddr, isASAEscrow, orderBookId);

        let delegateTemplate = null;
        if (!isASAEscrow) {
            delegateTemplate = algoDelegateTemplate.getTealTemplate();
        } else {
            delegateTemplate = asaDelegateTemplate.getTealTemplate();
        }
        console.log("min is: " + min);
        let res = delegateTemplate.split("<min>").join(min);
        res = res.split("<assetid>").join(assetid);
        res = res.split("<N>").join(N);
        res = res.split("<D>").join(D);
        res = res.split("<contractWriterAddr>").join(writerAddr);
        res = res.split("<orderBookId>").join(orderBookId);


        return res;

    },

    getLsigFromProgramSource : async function getLsigFromProgramSource(algosdk, algodClient, program, logProgramSource) {
        if (logProgramSource) {
            console.log("logging source!!");
            console.log(program);
        }
        let compilation = await this.compileProgram(algodClient, program);
        let uintAr = this._base64ToArrayBuffer(compilation.result);
        let args = undefined;
        let lsig = algosdk.makeLogicSig(uintAr, args);
        console.log("lsig addr: " + lsig.address());
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
