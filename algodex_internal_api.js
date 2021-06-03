const http = require('http');
const algosdk = require('algosdk');
import MyAlgo from '@randlabs/myalgo-connect';
//const myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
require('./algo_delegate_template_teal.js');
require('./ASA_delegate_template_teal.js');
require('./dex_teal.js');

import algodex from './algodex_api.js';

//FIXME - import below from algodex_api.js
const myAlgoWallet = new MyAlgo();
const DEBUG = 1; 
const DEBUG_SMART_CONTRACT_SOURCE = 0;
const MIN_ESCROW_BALANCE =     260000;
const MIN_ASA_ESCROW_BALANCE = 360000;
const ORDERBOOK_APPID = 15789309;
const ASA_ORDERBOOK_APPID = 15847181;

const AlgodexInternalApi = {
    doAlertInternal : function doAlertInternal() {
        alert(2);
        console.log("internal api call!!!");
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
    generateOrder : function generateOrder(makerWalletAddr, N, D, min, assetId) {
        let rtn = makerWalletAddr + "-" + N + "-" + D + "-" + min + "-" + assetId;
        console.log("generateOrder final str is: " + rtn);
        return rtn;
    },

    getExecuteOrderTransactionsAsTakerFromOrderEntry : 
        async function getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient, orderBookEscrowEntry, takerCombOrderBalance) {
            console.log("getExecuteOrderTransactionsFromOrderEntry orderBookEscrowEntry: " + algodex.dumpVar(orderBookEscrowEntry));

            // rec contains the original order creators address
            let orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            let n = orderBookEscrowEntry['n'];
            let d = orderBookEscrowEntry['d'];
            let min = 0; //orders are set to 0 minimum for now
            let assetid = orderBookEscrowEntry['assetId'];

            let isASAEscrow = orderBookEscrowEntry['isASAEscrow'];

            let escrowSource = algodex.buildDelegateTemplateFromArgs(min,assetid,n,d,orderCreatorAddr, isASAEscrow);
            const enableLsigLogging = DEBUG_SMART_CONTRACT_SOURCE; // escrow logging 
            let lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource,enableLsigLogging);

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
        console.log("inside executeASAOrder!", algodex.dumpVar(takerCombOrderBalance));
        try {
            let retTxns = [];
            let params = await algodClient.getTransactionParams().do();
            let appAccts = [];

            const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            const orderBookEntry = orderBookEscrowEntry['orderEntry'];
            const appId = ASA_ORDERBOOK_APPID;
            const takerAddr = takerCombOrderBalance['takerAddr'];
            let escrowAsaAmount = orderBookEscrowEntry['asaAmount'];
            let escrowAlgoAmount = orderBookEscrowEntry['algoAmount'];
            const currentEscrowBalance = escrowAlgoAmount;
            const currentASABalance = escrowAsaAmount;
            const assetId = orderBookEscrowEntry['assetId'];

            appAccts.push(orderCreatorAddr);
            appAccts.push(takerAddr);

            
            // 1000000-250000-0-15322902
            // n-d-minOrderSize-assetId
            const orderBookEntrySplit = orderBookEntry.split("-");
            const n = orderBookEntrySplit[0];
            const d = orderBookEntrySplit[1];
            console.log("n: ", n, " d: ", d);
            
            //let escrowAccountInfo = await algodex.getAccountInfo(lsig.address()); //FIXME - shouldn't require HTTP look up
            let closeRemainderTo = undefined;

            let closeoutFromASABalance = true;
            const min_asa_balance = 0;

            let executionFees = 0.004 * 1000000;
            const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

            let algoTradeAmount = parseFloat(d)/n*escrowAsaAmount;
            if (algoTradeAmount > takerCombOrderBalance['algoBalance']) {
                console.log("here999a reducing algoTradeAmount, currently at: " + algoTradeAmount); 
                algoTradeAmount = Math.floor(takerCombOrderBalance['algoBalance']);
                console.log("here999b reduced to", algoTradeAmount);
            } //FIXME: factor in fees

            if (takerCombOrderBalance['asaBalance'] < 1 || takerCombOrderBalance['algoBalance'] < executionFees) {
                console.log("asa escrow here9991b balance too low, returning early!");
                return; //no balance left to use for buying ASAs
            }
            if (takerCombOrderBalance['asaBalance'] < escrowAsaAmount) {
                console.log("asa escrow here9991 takerCombOrderBalance['asaBalance'] < escrowAsaAmount",
                        takerCombOrderBalance['asaBalance'], escrowAsaAmount);
                escrowAsaAmount = takerCombOrderBalance['asaBalance'];
            }

            if ((currentASABalance - escrowAsaAmount) > min_asa_balance) {
                console.log("asa escrow here9992 (currentASABalance - escrowAsaAmount) > min_asa_balance",
                        currentASABalance, escrowAsaAmount, min_asa_balance);
                closeoutFromASABalance = false;
            }

            //FIXME - need more logic to transact correct price in case balances dont match order balances
            console.log("closeoutFromASABalance: " + closeoutFromASABalance);
            takerCombOrderBalance['algoBalance'] -= executionFees;
            takerCombOrderBalance['algoBalance'] -= algoTradeAmount;
            takerCombOrderBalance['asaBalance'] -= escrowAsaAmount;
            console.log("ASA here110 algoAmount asaAmount txnFee takerOrderBalance: ", algoTradeAmount,
                        escrowAsaAmount, executionFees, algodex.dumpVar(takerCombOrderBalance));

            console.log("receiving ASA " + escrowAsaAmount + " from  " + lsig.address());
            console.log("sending ALGO amount " + algoTradeAmount + " to " + orderCreatorAddr);


            if ((currentEscrowBalance - executionFees < MIN_ASA_ESCROW_BALANCE) 
                //FIXME: reimburse fees!
                || closeoutFromASABalance == true) {
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
            appArgs.push(enc.encode(orderCreatorAddr));
            console.log(appArgs.length);

            if (closeRemainderTo == undefined) {
                transaction1 = algosdk.makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts);
            } else {
                transaction1 = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts);
            }
            console.log("app call type is: " + appCallType);

            let fixedTxn2 = {
                type: 'pay',
                from: takerAddr,
                to:  orderCreatorAddr,
                amount: algoTradeAmount,
                ...params
            };
            //myAlgoWalletUtil.setTransactionFee(fixedTxn2);


            // Make payment tx signed with lsig
            // Algo payment from order executor to escrow creator
           // let transaction2 = algosdk.makePaymentTxnWithSuggestedParams(orderExecutor.addr, orderCreatorAddr, amount, 
           //     undefined, undefined, params);

            // Make asset xfer

            // Asset transfer from escrow account to order executor
            let transaction3 = algosdk.makeAssetTransferTxnWithSuggestedParams(lsig.address(), takerAddr, closeRemainderTo, undefined,
                escrowAsaAmount, undefined, assetId, params);

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

            let txns = [transaction1, fixedTxn2, transaction3, transaction4 ];
           
            const groupID = algosdk.computeGroupID(txns);
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }
            
            let signedTx1 = algosdk.signLogicSigTransactionObject(txns[0], lsig);
            //let signedTx2 = await myAlgoWallet.signTransaction(fixedTxn2);
            let signedTx3 = algosdk.signLogicSigTransactionObject(txns[2], lsig);
            let signedTx4 = null;
            if (closeRemainderTo != undefined) {
                signedTx4 = algosdk.signLogicSigTransactionObject(txns[3], lsig);
            }

            retTxns.push({
                'signedTxn': signedTx1.blob,
            });
            retTxns.push({
                'unsignedTxn': fixedTxn2,
                'needsUserSig': true
            });
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
                algodex.dumpVar(orderBookEscrowEntry), algodClient,
                        takerCombOrderBalance);

            const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
            const orderBookEntry = orderBookEscrowEntry['orderEntry'];
            const appId = ORDERBOOK_APPID;
            let escrowAsaAmount = orderBookEscrowEntry['asaAmount'];
            const currentEscrowAlgoBalance = orderBookEscrowEntry['algoAmount'];
            let algoAmountReceiving = orderBookEscrowEntry['algoAmount'];
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
            
            //let escrowAccountInfo = await algodex.getAccountInfo(lsig.address()); //FIXME - load from order book cache not from here
            //let currentEscrowBalance = escrowAlgoAmount;
            let closeRemainderTo = undefined;
            const txnFee = 0.004 * 1000000; //FIXME - make more accurate
            const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

            algoAmountReceiving -= txnFee; // this will be the transfer amount
            console.log("here1");
            console.log("takerOrderBalance: " + algodex.dumpVar(takerCombOrderBalance));
            console.log("algoAmount: " + algoAmountReceiving);

            //if (escrowAlgoAmount + txnFee > currentEscrowBalance) {
            //    escrowAlgoAmount = currentEscrowBalance - txnFee;
            //    console.log("here1b reducing algoAmount to " + escrowAlgoAmount + " due to current escrow balance " + currentEscrowBalance);
            //}

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

            let asaAmount = parseFloat(n)/d*algoAmountReceiving;
            console.log("here6");
            console.log("asa amount: " + asaAmount);

            if (asaAmount % 1 != 0) {
                // round down decimals. possibly change this later?
                asaAmount = Math.floor(asaAmount); 

                console.log("here7");
                console.log("increasing from decimal asa amount: " + asaAmount);

                // recalculating receiving amount
                // use math.floor to give slightly worse deal for taker
                algoAmountReceiving = Math.floor(parseFloat(d)/n*asaAmount);
                console.log("recalculating receiving amount to: " + algoAmountReceiving);
            }

            if (takerCombOrderBalance['asaBalance'] < asaAmount) {
                console.log("here8");
                console.log("here8 reducing asa amount due to taker balance: ", asaAmount);
                asaAmount = takerCombOrderBalance['asaBalance'];
                console.log("here8 asa amount is now: ", asaAmount);

                algoAmountReceiving = parseFloat(d)/n*asaAmount;
                console.log("here9");
                console.log("recalculating algoamount: " + algoAmountReceiving);
                if (algoAmountReceiving % 1 != 0) {
                    // give slightly worse deal for taker if decimal
                    algoAmountReceiving = Math.floor(algoAmountReceiving); 
                    console.log("here10 increasing algoAmount due to decimal: " + algoAmountReceiving);
                }
            }
            //asaAmount = 3; //Set this to 3 (a low amount) to test breaking inequality in smart contract
            takerCombOrderBalance['algoBalance'] -= txnFee;
            takerCombOrderBalance['algoBalance'] -= algoAmountReceiving;
            takerCombOrderBalance['asaBalance'] -= asaAmount;
            console.log("here11 algoAmount asaAmount txnFee takerOrderBalance: ", algoAmountReceiving,
                        asaAmount, txnFee, algodex.dumpVar(takerCombOrderBalance));

            console.log("receiving " + algoAmountReceiving + " from  " + lsig.address());
            console.log("sending ASA amount " + asaAmount + " to " + orderCreatorAddr);
            if (currentEscrowAlgoBalance - algoAmountReceiving < MIN_ESCROW_BALANCE) {
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
            appArgs.push(enc.encode(orderCreatorAddr));
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
            console.log("orderBookEntry: ", algodex.dumpVar(orderBookEntry) );

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

        console.log("queued orders: ", algodex.dumpVar(queuedOrders));
        return queuedOrders;
    },

    closeASAOrder : async function closeASAOrder(algodClient, escrowAddr, creatorAddr, index, appArgs, lsig, assetId) {
        console.log("closing asa order!!!");

        try {
            // get node suggested parameters
            let params = await algodClient.getTransactionParams().do();

            // create unsigned transaction
            let txn = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, index, appArgs)
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

            let txns = [txn, txn2, txn3];
            const groupID = algosdk.computeGroupID(txns);
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }

            //let closeOutTxn = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts);

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
            //algodex.printTransactionDebug([signedTx.blob]);

            let signed = [];
            signed.push(signedTx.blob);
            signed.push(signedTx2.blob);
            signed.push(signedTx3.blob);
        
            algodex.printTransactionDebug(signed);

            //console.log(Buffer.concat(signed.map(txn => Buffer.from(txn))).toString('base64'));
            let tx = await algodClient.sendRawTransaction(signed).do();
            console.log(tx.txId);

            await algodex.waitForConfirmation(algodClient, tx.txId);

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

        return;
    },

    // close order 
    closeOrder : async function closeOrder(algodClient, escrowAddr, creatorAddr, index, appArgs, lsig) {
        let accountInfo = await algodex.getAccountInfo(lsig.address());
        let alreadyOptedIn = false;
        if (accountInfo != null && accountInfo['assets'] != null
            && accountInfo['assets'].length > 0 && accountInfo['assets'][0] != null) {
            await closeASAOrder(algodClient, escrowAddr, creatorAddr, index, appArgs, lsig);
            return;
        }
        //        && accountInfo['apps-local-state'].length > 0
        //        && accountInfo['apps-local-state'][0].id == 15789309) {
        //        alreadyOptedIn = true;
        //    }


        try {
            // get node suggested parameters
            let params = await algodClient.getTransactionParams().do();

            // create unsigned transaction
            let txn = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, index, appArgs)
            let txId = txn.txID().toString();
            // Submit the transaction

            // Make payment tx signed with lsig
            let txn2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), creatorAddr, 0, creatorAddr, undefined, params);
           
            let txns = [txn, txn2];
            const groupID = algosdk.computeGroupID(txns)
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }

            //let closeOutTxn = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts);

            let signedTx = algosdk.signLogicSigTransactionObject(txn, lsig);
            txId = signedTx.txID;
            //console.log("signedTxn:" + JSON.stringify(signedTx));
            console.log("Signed transaction with txID: %s", txId);

            let signedTx2 = algosdk.signLogicSigTransactionObject(txn2, lsig);
            let txId2 = signedTx2.txID;
            //console.log("signedTxn:" + JSON.stringify(signedTx));
            console.log("Signed transaction with txID: %s", txId2);

            //algodex.printTransactionDebug([signedTx.blob]);

            let signed = [];
            signed.push(signedTx.blob);
            signed.push(signedTx2.blob);
           
            algodex.printTransactionDebug(signed);

            //console.log(Buffer.concat(signed.map(txn => Buffer.from(txn))).toString('base64'));
            let tx = await algodClient.sendRawTransaction(signed).do();
            console.log(tx.txId);

            await algodex.waitForConfirmation(algodClient, tx.txId);

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

    buildDelegateTemplateFromArgs : function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow) {
        if (isNaN(min) || isNaN(assetid) || isNaN(N) || isNaN(D)) {
            return null;
        }
        console.log("here913 in buildDelegateTemplateFromArgs. min, assetid, N, D, writerAddr, isASAEscrow",
            min, assetid, N, D, writerAddr, isASAEscrow);

        let delegateTemplate = null;
        if (!isASAEscrow) {
            delegateTemplate = getSellAlgoDelegateTemplate();
        } else {
            delegateTemplate = getSellASADelegateTemplate();
        }
        console.log("min is: " + min);
        let res = delegateTemplate.replaceAll("<min>", min);

        res = res.replaceAll("<assetid>", assetid);
        res = res.replaceAll("<N>", N);
        res = res.replaceAll("<D>", D);
        res = res.replaceAll("<contractWriterAddr>", writerAddr);


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
        var binary_string = window.atob(b64);
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }



}

export default AlgodexInternalApi;