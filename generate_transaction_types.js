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
    compileProgram: async function compileProgram(client, programSource) {
        let encoder = new TextEncoder();
        let programBytes = encoder.encode(programSource);
        let compileResponse = await client.compile(programBytes).do();
        let compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, "base64"));
        return compiledBytes;
    },

    getPayTxn : async function (client, fromAcct, toAcct, amount, shouldClose) {
        let params = await client.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        params.fee = 1000;
        params.flatFee = true;
        const receiver = toAcct.addr;
        const enc = new TextEncoder();
        let note = enc.encode("Hello World");
        let closeAddr = undefined;
        if (shouldClose === true) {
            closeAddr = toAcct.addr;
        }
        let txn = algosdk.makePaymentTxnWithSuggestedParams(fromAcct.addr, receiver, amount, closeAddr, note, params); 
        return txn;
    },

    getCreateAppTxn : async function getCreateAppTxn(client, creatorAccount) {
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
            // let txId = txn.txID().toString();

            return txn;
            // Sign the transaction
            //let signedTxn = txn.signTxn(creatorAccount.sk);
            //console.log("Signed transaction with txID: %s", txId);

            // Submit the transaction
            //await client.sendRawTransaction(signedTxn).do();

            // Wait for confirmation
            //await waitForConfirmation(client, txId);

            // display results
            //let transactionResponse = await client.pendingTransactionInformation(txId).do();
            //let appId = transactionResponse['application-index'];
            //console.log("Created new app-id: ",appId);
            //return appId;

    }
}

module.exports = GenerateTransactions;

