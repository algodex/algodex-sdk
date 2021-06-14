const http = require('http');
const algosdk = require('algosdk');

const bigDecimal = require('js-big-decimal');

let MyAlgo = null;
if (typeof window != 'undefined') {
    MyAlgo = require('@randlabs/myalgo-connect');
}

//const myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
const algoDelegateTemplate = require('./algo_delegate_template_teal.js');
const asaDelegateTemplate = require('./ASA_delegate_template_teal.js');
//require('./dex_teal.js');

//FIXME - import below from algodex_api.js

let myAlgoWallet = null;

if (MyAlgo != null) {
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
    generateOrder : function generateOrder(makerWalletAddr, N, D, min, assetId) {
        let rtn = makerWalletAddr + "-" + N + "-" + D + "-" + min + "-" + assetId;
        console.log("generateOrder final str is: " + rtn);
        return rtn;
    },
    dumpVar : function dumpVar(x) {
        return JSON.stringify(x, null, 2);
    },
    getExecuteOrderTransactionsAsTakerFromOrderEntry : 
        async function getExecuteOrderTransactionsAsTakerFromOrderEntry(algodClient, orderBookEscrowEntry, takerCombOrderBalance) {
            console.log("getExecuteOrderTransactionsFromOrderEntry orderBookEscrowEntry: " + this.dumpVar(orderBookEscrowEntry));

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
            let escrowAsaAmount = orderBookEscrowEntry['asaBalance'];
            let escrowAlgoAmount = orderBookEscrowEntry['algoBalance'];
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
            console.log("n: ", n, " d: ", d, " asset amount: " , escrowAsaAmount);
            
            //let escrowAccountInfo = await this.getAccountInfo(lsig.address()); //FIXME - shouldn't require HTTP look up
            let closeRemainderTo = undefined;

            let closeoutFromASABalance = true;
            const min_asa_balance = 0;

            let executionFees = 0.004 * 1000000;
            const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution
            const price = new bigDecimal(d).divide(new bigDecimal(n), 30);
            const bDecOne = new bigDecimal(1);

            escrowAsaAmount = new bigDecimal(escrowAsaAmount);
            let algoTradeAmount = price.multiply(escrowAsaAmount);
            if (algoTradeAmount.getValue().includes('.')) {
                algoTradeAmount = algoTradeAmount.floor().add(bDecOne); //round up to give seller more money
            }

            //FIXME - check if lower than wallet balance
            if (algoTradeAmount.compareTo(new bigDecimal(takerCombOrderBalance['algoBalance']) == 1)
                 && algoTradeAmount.compareTo(bDecOne) == 1
                 && algoTradeAmount.subtract(new bigDecimal(takerCombOrderBalance['algoBalance'])).compareTo(bDecOne) == 1) {

                console.log("here999a reducing algoTradeAmount, currently at: " + algoTradeAmount); 
                algoTradeAmount = new bigDecimal(Math.floor(takerCombOrderBalance['algoBalance']));
                escrowAsaAmount = algoTradeAmount.divide(price);
                console.log("checking max: " + escrowAsaAmount + " " + 1 );
                if (!escrowAsaAmount.compareTo(bDecOne)) { //don't allow 0 value
                    escrowAsaAmount = bDecOne;
                }
                console.log("here999b reduced to algoTradeAmount escrowAsaAmount", algoTradeAmount, escrowAsaAmount);

                if (escrowAsaAmount.getValue().includes('.')) {
                    //round ASA amount
                    escrowAsaAmount = escrowAsaAmount.round();
                    algoTradeAmount = price.multiply(escrowAsaAmount);
                    if (algoTradeAmount.getValue().includes('.')) {
                        algoTradeAmount = algoTradeAmount.floor().add(bDecOne); //round up to give seller more money
                        console.log("here999bc increased algo to algoTradeAmount escrowAsaAmount", algoTradeAmount, escrowAsaAmount);
                    }
                    console.log("here999c changed to algoTradeAmount escrowAsaAmount", algoTradeAmount, escrowAsaAmount);
                }
            } //FIXME: factor in fees

           // if (takerCombOrderBalance['asaBalance'] < 1 || takerCombOrderBalance['algoBalance'] < executionFees) {
            //    console.log("asa escrow here9991b balance too low, returning early!");
            //    return; //no balance left to use for buying ASAs
            //}
            if (new bigDecimal(takerCombOrderBalance['asaBalance']).compareTo(escrowAsaAmount) == -1) {
                console.log("asa escrow here9991 takerCombOrderBalance['asaBalance'] < escrowAsaAmount",
                        takerCombOrderBalance['asaBalance'], escrowAsaAmount);
                escrowAsaAmount = new bigDecimal(takerCombOrderBalance['asaBalance']);
                algoTradeAmount = price.multiply(escrowAsaAmount);
                if (bigDecimal.modulus(algoTradeAmount, bDecOne) != 0) {
                    algoTradeAmount = algoTradeAmount.floor().add(bDecOne); //round up to give seller more money
                }
            }

            if (new bigDecimal(currentASABalance).subtract(escrowAsaAmount)
                    .compareTo(new bigDecimal(min_asa_balance)) == 1) {

                console.log("asa escrow here9992 (currentASABalance - escrowAsaAmount) > min_asa_balance",
                        currentASABalance, escrowAsaAmount, min_asa_balance);
                closeoutFromASABalance = false;
            }

            if (takerCombOrderBalance['walletAlgoBalance'] < executionFees + parseInt(algoTradeAmount.getValue())) {
               console.log("asa escrow here9992b balance too low, returning early! ", executionFees, algoTradeAmount, takerCombOrderBalance);
               return; //no balance left to use for buying ASAs
            }

            if (takerCombOrderBalance['walletASABalance'] < parseInt(escrowAsaAmount.getValue())) {
               console.log("asa escrow here9992b balance too low, returning early! ", executionFees, algoTradeAmount, takerCombOrderBalance);
               return; //no balance left to use for buying ASAs
            }

            escrowAsaAmount = parseInt(escrowAsaAmount.getValue());
            algoTradeAmount = parseInt(algoTradeAmount.getValue());
            //FIXME - need more logic to transact correct price in case balances dont match order balances
            console.log("closeoutFromASABalance: " + closeoutFromASABalance);

            console.log("almost final amounts algoTradeAmount escrowAsaAmount ", algoTradeAmount, escrowAsaAmount);
            //algoTradeAmount = algoTradeAmount / 2;

            takerCombOrderBalance['algoBalance'] -= executionFees;
            takerCombOrderBalance['algoBalance'] -= algoTradeAmount;
            takerCombOrderBalance['walletAlgoBalance'] -= executionFees;
            takerCombOrderBalance['walletAlgoBalance'] -= algoTradeAmount;

            takerCombOrderBalance['asaBalance'] -= escrowAsaAmount;
            takerCombOrderBalance['walletAsaBalance'] -= escrowAsaAmount;
            console.log("ASA here110 algoAmount asaAmount txnFee takerOrderBalance: ", algoTradeAmount,
                        escrowAsaAmount, executionFees, this.dumpVar(takerCombOrderBalance));

            console.log("receiving ASA " + escrowAsaAmount + " from  " + lsig.address());
            console.log("sending ALGO amount " + algoTradeAmount + " to " + orderCreatorAddr);


            if ((currentEscrowBalance - executionFees < constants.MIN_ASA_ESCROW_BALANCE) 
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
            appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);

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
            algoAmountReceiving = new bigDecimal(algoAmountReceiving);
            let asaAmount = algoAmountReceiving.divide(price, 30);
            console.log("here6");
            console.log("asa amount: " + asaAmount);

            if (asaAmount.getValue().includes('.')) {
                // round down decimals. possibly change this later?
                asaAmount = asaAmount.floor();

                console.log("here7");
                console.log("increasing from decimal asa amount: " + asaAmount);

                // recalculating receiving amount
                // use math.floor to give slightly worse deal for taker
                algoAmountReceiving = asaAmount.multiply(price).floor();
                console.log("recalculating receiving amount to: " + algoAmountReceiving);
            }

            if (new bigDecimal(takerCombOrderBalance['asaBalance']).compareTo(asaAmount) == -1) {
                console.log("here8");
                console.log("here8 reducing asa amount due to taker balance: ", asaAmount);
                asaAmount = takerCombOrderBalance['asaBalance'];
                console.log("here8 asa amount is now: ", asaAmount);

                algoAmountReceiving = price.multiply(asaAmount);
                console.log("here9");
                console.log("recalculating algoamount: " + algoAmountReceiving);
                if (algoAmountReceiving.getValue().includes('.')) {
                    // give slightly worse deal for taker if decimal
                    algoAmountReceiving = algoAmountReceiving.floor();
                    console.log("here10 increasing algoAmount due to decimal: " + algoAmountReceiving);
                }
            }

            //asaAmount = 3; //Set this to 3 (a low amount) to test breaking inequality in smart contract
            console.log("almost final ASA amount: " + asaAmount);
            //asaAmount = asaAmount / 2;
            //console.log("dividing asaAmount / 2: " + asaAmount);
            
            // These are expected to be integers now
            algoAmountReceiving = parseInt(algoAmountReceiving.getValue());
            asaAmount = parseInt(asaAmount.getValue());

            takerCombOrderBalance['algoBalance'] -= txnFee;
            takerCombOrderBalance['algoBalance'] -= algoAmountReceiving;
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
            console.log("orderBookEntry: ", this.dumpVar(orderBookEntry) );

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

        console.log("queued orders: ", this.dumpVar(queuedOrders));
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

        return;
    },
    getAccountInfo : async function getAccountInfo(accountAddr) {
        let result = await m.request({
                method: "GET",
                url: "https://testnet.algoexplorerapi.io/v2/accounts/"+accountAddr,
        });
        return result;
    },
    // close order 
    closeOrder : async function closeOrder(algodClient, escrowAddr, creatorAddr, index, appArgs, lsig) {
        let accountInfo = await this.getAccountInfo(lsig.address());
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

            //this.printTransactionDebug([signedTx.blob]);

            let signed = [];
            signed.push(signedTx.blob);
            signed.push(signedTx2.blob);
           
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
    waitForConfirmation : async function(algodClient, txId) {

        let checkPending = await this.checkPending(algodClient, txId, 4);
        if (checkPending == null || checkPending == "Transaction Rejected") throw "Transaction Rejected";
        if (checkPending == "Transaction Still Pending") throw "Transaction Still Pending";
        console.log("Transaction confirmed in round " + checkPending["confirmed-round"]);
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
        console.log('TxnGroup to debug:');
        console.log(Buffer.concat(signedTxns.map(txn => Buffer.from(txn))).toString('base64'));
    },

    buildDelegateTemplateFromArgs : 
      function buildDelegateTemplateFromArgs(min, assetid, N, D, writerAddr, isASAEscrow) {
        let orderBookId = null;
        if (isASAEscrow) {
            orderBookId = ASA_ESCROW_ORDER_BOOK_ID;
        } else {
            orderBookId = ALGO_ESCROW_ORDER_BOOK_ID;
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
        let res = delegateTemplate.replaceAll("<min>", min);

        res = res.replaceAll("<assetid>", assetid);
        res = res.replaceAll("<N>", N);
        res = res.replaceAll("<D>", D);
        res = res.replaceAll("<contractWriterAddr>", writerAddr);
        res = res.replaceAll("<orderBookId>", orderBookId);


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

module.exports = AlgodexInternalApi;
