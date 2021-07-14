/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const http = require('http');
const algosdk = require('algosdk');

const algoDelegateTemplate = require('./algo_delegate_template_teal.js');
const asaDelegateTemplate = require('./ASA_delegate_template_teal.js');
const algoOrderBook = require('./dex_teal.js');
const asaOrderBook = require('./asa_dex_teal.js');

//require('./dex_teal.js');
const dexInternal = require('./algodex_internal_api.js');
const algodex = require('./algodex_api.js');
const constants = require('./constants.js');
const transactionGenerator = require('./generate_transaction_types.js');

let ALGO_ESCROW_ORDER_BOOK_ID = -1;
let ASA_ESCROW_ORDER_BOOK_ID = -1;

const TestHelper = {
    getLocalClient : function getLocalClientAndEnv() {
        const algodClient = algodex.initAlgodClient("test");
        return algodClient;
    },

    getRandomAccount : function getRandomAccount() {
        return algosdk.generateAccount();
    },

    getAccountInfo : function getAccountInfo(addr) {
        return algodex.getAccountInfo(addr);
    },

    getOpenAccount : function getOpenAccount() {
        //WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI
        let mn = "mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above";
        let openAccount = algosdk.mnemonicToSecretKey(mn);
        return openAccount;
    },

    transferFunds : async function transferFunds (client, fromAccount, toAccount, amount) {
        const fundTxn = await transactionGenerator.getPayTxn(client, fromAccount, toAccount, amount, false);
        const fundTxnId = fundTxn.txID().toString();

        let signedFundTxn = fundTxn.signTxn(fromAccount.sk);
        console.log("Signed transaction with txID: %s", fundTxnId);

        // Submit the transaction
        try {
            await client.sendRawTransaction(signedFundTxn).do();
        } catch (e) {
            console.log(JSON.stringify(e));
        }

        // Wait for confirmation
        await this.waitForConfirmation(client, fundTxnId);
    },

    closeAccount : async function closeAccount (client, fromAccount, toAccount) {
        const fundTxn = await transactionGenerator.getPayTxn(client, fromAccount, toAccount, 0, true);
        const fundTxnId = fundTxn.txID().toString();
        let signedTxn = fundTxn.signTxn(fromAccount.sk);
        console.log("Signed transaction with txID: %s", fundTxnId);
        // Submit the transaction
        try {
            await client.sendRawTransaction(signedTxn).do();
        } catch (e) {
            console.log(JSON.stringify(e));
        }
        // Wait for confirmation
        await this.waitForConfirmation(client, fundTxnId);
    },

    deleteApplication : async function deleteApplication (client, sender, appId) {
        // create unsigned transaction
        let params = await client.getTransactionParams().do();
        let txn = algosdk.makeApplicationDeleteTxn(sender.addr, params, appId);

        // sign, send, await
        let signedTxn = txn.signTxn(sender.sk);
        let txId = txn.txID().toString();

        console.log("Signed transaction with txID: %s", txId);
        // Submit the transaction
        try {
            await client.sendRawTransaction(signedTxn).do();
        } catch (e) {
            console.log(JSON.stringify(e));
        }
        // display results
        let transactionResponse = await client.pendingTransactionInformation(txId).do();
        console.log("Deleted app-id: ",appId);
    },

    getExecuteAccount : function getExecuteAccount() {
        //UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A
        let mn = "three satisfy build purse lens another idle fashion base equal echo recall proof hill shadow coach early palm act wealth dawn menu portion above mystery";
        let executeAccount = algosdk.mnemonicToSecretKey(mn);
        return executeAccount;
    },

    // helper function to await transaction confirmation
    waitForConfirmation : async function waitForConfirmation (algodClient, txId) {
        let status = (await algodClient.status().do());
        let lastRound = status["last-round"];
        while (true) {
            const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
            if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
            //Got the completed Transaction
            console.log("Transaction " + txId + " confirmed in round " + pendingInfo["confirmed-round"]);
            break;
            }
            lastRound++;
            await algodClient.statusAfterBlock(lastRound).do();
        }
    }

}

module.exports = TestHelper;
