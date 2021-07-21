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
    getCreateAppTxn : async function (client, creatorAccount) {
            // define sender as creator

            const approvalProgramSource = algoOrderBook.getAlgoOrderBookApprovalProgram();
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
    }
}

module.exports = GenerateTransactions;

