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

    getOpenAccount : function getOpenAccount() {
        //WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI
        let mn = "mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above";
        let openAccount = algosdk.mnemonicToSecretKey(mn);
        return openAccount;
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
