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
    getCreateAppTxn : function getCreateAppTxn() {
        async function getCreateAppTxn(client) {
            // define sender as creator

            const approvalProgram = algoOrderBook.getAlgoOrderBookApprovalProgram();
            const clearProgram = algoOrderBook.getClearProgram();
            const creatorAccount = testHelper.getOpenAccount();

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
            let txn = algosdk.makeApplicationCreateTxn(sender, params, onComplete, 
                                                    approvalProgram, clearProgram, 
                                                    localInts, localBytes, globalInts, globalBytes,);
            let txId = txn.txID().toString();

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
}

module.exports = GenerateTransactions;

