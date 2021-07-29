/////////////////////////////
// Alexander Trefonas      //
// 7/12/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const http = require('http');
const algosdk = require('algosdk');

const myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
const algoDelegateTemplate = require('./algo_delegate_template_teal.js');
const asaDelegateTemplate = require('./ASA_delegate_template_teal.js');
const algoOrderBook = require('./dex_teal.js');
const asaOrderBook = require('./asa_dex_teal.js');

//require('./dex_teal.js');

const dexInternal = require('./algodex_internal_api.js');
const algodex = require('./algodex_api.js');

const constants = require('./constants.js');
const testHelper = require('./test_helper.js');

let ALGO_ESCROW_ORDER_BOOK_ID = -1;
let ASA_ESCROW_ORDER_BOOK_ID = -1;

const GenerateTransactions = {
    // helper function to compile program source  
    compileProgram: async function (client, programSource) {
        let encoder = new TextEncoder();
        let programBytes = encoder.encode(programSource);
        let compileResponse = await client.compile(programBytes).do();
        let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
        return compiledBytes;
    },

    getAssetSendTxn : async function (client, fromAcct, toAcct, amount, assetId, shouldClose) {
        if (typeof(fromAcct) !== "string") {
            fromAcct = fromAcct.addr;
        }
        if (typeof(toAcct) !== "string") {
            toAcct = toAcct.addr;
        }
        let params = await client.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        params.fee = 1000;
        params.flatFee = true;
        let closeAddr = undefined;
        if (shouldClose === true) {
            closeAddr = toAcct;
        }
        
        let txn = algosdk.makeAssetTransferTxnWithSuggestedParams(fromAcct, toAcct, closeAddr, undefined,
                amount, undefined, assetId, params);
        return txn;
    },

    getPayTxn : async function (client, fromAcct, toAcct, amount, shouldClose) {
        if (typeof(fromAcct) !== "string") {
            fromAcct = fromAcct.addr;
        }
        if (typeof(toAcct) !== "string") {
            toAcct = toAcct.addr;
        }
        let params = await client.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        params.fee = 1000;
        params.flatFee = true;
        const enc = new TextEncoder();
        let note = enc.encode("Hello World");
        let closeAddr = undefined;
        if (shouldClose === true) {
            closeAddr = toAcct;
        }
        let txn = algosdk.makePaymentTxnWithSuggestedParams(fromAcct, toAcct, amount, closeAddr, note, params); 
        return txn;
    },

    getCreateAppTxn : async function (client, creatorAccount, isAlgoEscrowApp = true) {
            // define sender as creator
            let approvalProgramSource = null;
            if (isAlgoEscrowApp) {
                approvalProgramSource = algoOrderBook.getAlgoOrderBookApprovalProgram();
            } else {
                approvalProgramSource = asaOrderBook.getASAOrderBookApprovalProgram();
            }
            const clearProgramSource = algoOrderBook.getClearProgram();

            // declare application state storage (immutable)
            const localInts = 2;
            const localBytes = 1;
            const globalInts = 0;
            const globalBytes = 1;

            sender = creatorAccount.addr;

            // declare onComplete as NoOp
            onComplete = algosdk.OnApplicationComplete.NoOpOC;

            // get node suggested parameters
            let params = await client.getTransactionParams().do();
            // create unsigned transaction

            let approvalProgram = await this.compileProgram(client, approvalProgramSource);
            let clearProgram = await this.compileProgram(client, clearProgramSource);

            let txn = algosdk.makeApplicationCreateTxn(sender, params, onComplete, 
                                                    approvalProgram, clearProgram, 
                                                    localInts, localBytes, globalInts, globalBytes,);

            return txn;
    },

    getCloseAlgoEscrowOrderTxns : async function (algodClient, creator, price, assetId, appId) {
        let numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
        let n = numAndDenom.n;
        let d = numAndDenom.d;
        let creatorAddr = creator.addr;

        let escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, creatorAddr, false);
        let lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
        let escrowAccountAddr = lsig.address();

        let outerTxns = [];
        // "2500-625-0-15322902"
        let orderBookEntry = n + "-" + d + "-0-" + assetId;
        console.log("closing order from order book entry!");
        console.log("escrowAccountAddr, creatorAddr, orderBookEntry", 
            escrowAccountAddr, creatorAddr, orderBookEntry);


        let appArgs = [];
        let enc = new TextEncoder();
        appArgs.push(enc.encode("close"));
        appArgs.push(enc.encode(orderBookEntry));
        appArgs.push(enc.encode(creatorAddr));
        console.log("args length: " + appArgs.length);

        // get node suggested parameters
        let params = await algodClient.getTransactionParams().do();

        // create unsigned transaction
        let txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, appId, appArgs);
        outerTxns.push({
            unsignedTxn: txn,
            lsig: lsig
        });
        // Submit the transaction

        // Make payment tx signed with lsig
        let txn2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), creatorAddr, 0, creatorAddr, undefined, params);
        outerTxns.push({
            unsignedTxn: txn2,
            lsig: lsig
        });

        let txn3 = algosdk.makePaymentTxnWithSuggestedParams(creatorAddr, creatorAddr, 0, undefined, undefined, params);

        outerTxns.push({
            unsignedTxn: txn3,
            senderAcct: creator
        });

        return outerTxns;
    },

    getCloseASAEscrowOrderTxns : async function (algodClient, creator, price, assetId, appId) {
        let numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
        let n = numAndDenom.n;
        let d = numAndDenom.d;
        let creatorAddr = creator.addr;

        let escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, creatorAddr, true);
        let lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
        let escrowAccountAddr = lsig.address();

        let outerTxns = [];
        // "2500-625-0-15322902"
        let orderBookEntry = n + "-" + d + "-0-" + assetId;
        console.log("closing order from order book entry!");
        console.log("escrowAccountAddr, creatorAddr, orderBookEntry", 
            escrowAccountAddr, creatorAddr, orderBookEntry);

        let appArgs = [];
        let enc = new TextEncoder();
        appArgs.push(enc.encode("close"));
        appArgs.push(enc.encode(orderBookEntry));
        appArgs.push(enc.encode(creatorAddr));
        console.log("args length: " + appArgs.length);

        // get node suggested parameters
        let params = await algodClient.getTransactionParams().do();

        // create unsigned transaction
        let txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, appId, appArgs)
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

        // proof of ownership transaction
        let txn4 = algosdk.makePaymentTxnWithSuggestedParams(creatorAddr, creatorAddr, 0, undefined, undefined, params);

        outerTxns.push({
            unsignedTxn: txn,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: txn2,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: txn3,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: txn4,
            senderAcct: creator
        });

        return outerTxns;
    },

    getExecuteAlgoEscrowOrderTxns : async function (algodClient, executorAccount, makerAccount, algoAmountReceiving, asaAmountSending, price, assetId, appId, shouldClose = false) {
        const orderCreatorAddr = makerAccount.addr;
        const min = 0;
        const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
        const n = numAndDenom.n;
        const d = numAndDenom.d;
        const takerAddr = executorAccount.addr;

        let appCallType = null;
        const orderBookEntry = algodex.generateOrder(orderCreatorAddr, n, d, min, assetId, false);
        const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

        const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, false);
        const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
        const params = await algodClient.getTransactionParams().do();

        const appAccts = [];
        appAccts.push(orderCreatorAddr);
        appAccts.push(takerAddr);

        let closeRemainderTo = undefined;

        if (shouldClose) {
            closeRemainderTo = makerAccount.addr;
        }

        if (closeRemainderTo == undefined) {
            appCallType = "execute";
        } else {
            appCallType = "execute_with_closeout";
        }
        console.log("arg1: " + appCallType);
        console.log("arg2: " + orderBookEntry);
        console.log("arg3: " + orderCreatorAddr);
        
        let appArgs = [];
        let enc = new TextEncoder();
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
 
        let transaction3 = await this.getAssetSendTxn(algodClient, takerAddr, orderCreatorAddr, asaAmountSending, assetId, false);

        let transaction4 = null;

        if (closeRemainderTo == undefined) {
            // create refund transaction for fees
            transaction4 = await this.getPayTxn(algodClient, takerAddr, lsig.address(), refundFees, false);
        }

        let retTxns = [];

        retTxns.push({
            'unsignedTxn': transaction1,
            'lsig': lsig
        });
        retTxns.push({
            'unsignedTxn': transaction2,
            'lsig': lsig
        });
        retTxns.push({
            'unsignedTxn': transaction3,
            'senderAcct': executorAccount
        });

        if (transaction4 != null) {
            retTxns.push({
                'unsignedTxn': transaction4,
                'senderAcct': executorAccount
            });
        }

        return retTxns;


    },

    getExecuteASAEscrowOrderTxns : async function (algodClient, executorAccount, makerAccount, algoAmountSending, asaAmountReceiving, price, assetId, appId, shouldClose = false) {
        const orderCreatorAddr = makerAccount.addr;
        const min = 0;
        const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
        const n = numAndDenom.n;
        const d = numAndDenom.d;
        const takerAddr = executorAccount.addr;

        const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

        let appCallType = null;
        const orderBookEntry = algodex.generateOrder(orderCreatorAddr, n, d, min, assetId);

        const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, true);
        const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
        const params = await algodClient.getTransactionParams().do();

        const appAccts = [];
        appAccts.push(orderCreatorAddr);
        appAccts.push(takerAddr);
        
        let appArgs = [];
        let enc = new TextEncoder();
        appArgs.push(enc.encode(appCallType));
        appArgs.push(enc.encode(orderBookEntry));
        appArgs.push(algosdk.decodeAddress(orderCreatorAddr).publicKey);

        let transaction1 = null;
        let closeRemainderTo = undefined;

        if (shouldClose) {
            closeRemainderTo = makerAccount.addr;
        }
        if (closeRemainderTo == undefined) {
            transaction1 = algosdk.makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
        } else {
            transaction1 = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
        }
        console.log("app call type is: " + appCallType);

        let transaction2 = await this.getAssetSendTxn(algodClient, takerAddr, orderCreatorAddr, algoTradeAmount, assetID, false);

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
        
        if (transaction2b != null) {
            myAlgoWalletUtil.setTransactionFee(transaction2b);
        }

        let retTxns = [];

        retTxns.push({
            'unsignedTxn': transaction1,
            'lsig': lsig
        });
        retTxns.push({
            'unsignedTxn': transaction2,  // FIXME - change to sdk
            'senderAcct': executorAccount
        });

        if (transaction2b != null) {
            retTxns.push({
                'unsignedTxn': transaction2b, // FIXME - change to sdk
                'senderAcct': executorAccount
            });
        }
        retTxns.push({
            'unsignedTxn': transaction3,
            'lsig': lsig
        });
        if (closeRemainderTo != undefined) {
            // close out algo balance to owner
            retTxns.push({
                'unsignedTxn': transaction4,
                'lsig': lsig
            });
        } else {
            // fee refund
            retTxns.push({
                'unsignedTxn': transaction4,
                'senderAcct': executorAccount
            });
        }


    },

    getPlaceAlgoEscrowOrderTxns : async function (algodClient, makerAccount, algoOrderSize, price, assetId, appId, isExistingEscrow = false) {
        const makerAddr = makerAccount.addr;
        const min = 0;
        const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
        const n = numAndDenom.n;
        const d = numAndDenom.d;
        console.log("getPlaceAlgoEscrowOrderTxns makerWalletAddr, n, d, min, assetId",
            makerAddr, n, d, min, assetId);
        let program = algodex.buildDelegateTemplateFromArgs(min, assetId, n, d, makerAddr, false);
        let lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
        let generatedOrderEntry = algodex.generateOrder(makerAddr, n, d, min, assetId);
        let params = await algodClient.getTransactionParams().do();
        console.log("sending trans to: " + lsig.address());

        let txn = await this.getPayTxn(algodClient, makerAddr, lsig.address(), algoOrderSize, false);
        let outerTxns = [];

        outerTxns.push({
            unsignedTxn: txn,
            senderAcct: makerAccount
        });

        console.log("here3 calling app from logic sig to open order");
        let appArgs = [];
        var enc = new TextEncoder();
        appArgs.push(enc.encode("open"));
        appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
        appArgs.push(algosdk.decodeAddress(makerAddr).publicKey);

        //console.log("owners bit addr: " + ownersBitAddr);
        console.log("herezzz_888");
        console.log(appArgs.length);
        let logSigTrans = null;

        if (!isExistingEscrow) {
            logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig, appId, appArgs, "appOptIn");
            outerTxns.push({
                unsignedTxn: logSigTrans,
                lsig: lsig
            });
        }
        // asset opt-in transfer
        let assetOptInTxn = await this.getAssetSendTxn(algodClient, makerAddr, makerAddr, 0, assetId, false);;

        outerTxns.push({
            unsignedTxn: assetOptInTxn,
            senderAcct: makerAccount
        });
        return outerTxns;
    },

    getPlaceASAEscrowOrderTxns : async function (algodClient, makerAccount, asaOrderSize, price, assetId, appId, isExistingEscrow = false) {
        console.log("checking assetId type");
        assetId = parseInt(assetId+"");

        const makerAddr = makerAccount.addr;
        const min = 0;
        const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
        const n = numAndDenom.n;
        const d = numAndDenom.d;

        let outerTxns = [];

        let program = algodex.buildDelegateTemplateFromArgs(min, assetId, n, d, makerAddr, true);

        let lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
        let generatedOrderEntry = algodex.generateOrder(makerAddr, n, d, min, assetId);
        console.log("address is: " + lsig.address());
        
        // check if the lsig has already opted in
        let accountInfo = await algodex.getAccountInfo(lsig.address());
        let alreadyOptedIn = false;
        if (accountInfo != null && accountInfo['apps-local-state'] != null
                && accountInfo['apps-local-state'].length > 0
                && accountInfo['apps-local-state'][0].id == appId) {
            alreadyOptedIn = true;
        }
        console.log("alreadyOptedIn: " + alreadyOptedIn);
        console.log("acct info:" + JSON.stringify(accountInfo));

        let params = await algodClient.getTransactionParams().do();
        console.log("sending trans to: " + lsig.address());


        let assetSendTrans = await this.getAssetSendTxn(algodClient, makerAddr, lsig.address(), asaOrderSize, assetId,
                 false);

        let payTxn = await this.getPayTxn(algodClient, makerAddr, lsig.address(), constants.MIN_ASA_ESCROW_BALANCE,
            false);
       
        myAlgoWalletUtil.setTransactionFee(payTxn);

        console.log("typeof: " + typeof payTxn.txId);
        console.log("the val: " + payTxn.txId);

        //console.log("confirmed!!");
        // create unsigned transaction

        console.log("here3 calling app from logic sig to open order");
        let appArgs = [];
        var enc = new TextEncoder();
        appArgs.push(enc.encode("open"));

        appArgs.push(enc.encode(generatedOrderEntry.slice(59)));

        // add owners address as arg
        //ownersAddr = "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI";
        //ownersBitAddr = (algosdk.decodeAddress(ownersAddr)).publicKey;
        appArgs.push(enc.encode(makerAddr));
        console.log(appArgs.length);

        let logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig, appId, 
                    appArgs, "appOptIn");

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
            senderAcct: makerAccount
        });
        outerTxns.push({
            unsignedTxn: logSigTrans,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: logSigAssetOptInTrans,
            lsig: lsig
        });
        outerTxns.push({
            unsignedTxn: assetSendTrans,
            senderAcct: makerAccount
        });

        return outerTxns;
    },

}

module.exports = GenerateTransactions;

