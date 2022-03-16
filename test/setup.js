/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const algosdk = require('algosdk');
const axios = require('axios').default;
const deprecate = require('../lib/functions/deprecate')
const algodex = require('../lib/AlgodexApi.js');
const constants = require('../lib/constants.js');
const transactionGenerator = require('../generate_transaction_types.js');

const ALGOD_SERVER='https://testnet.algoexplorerapi.io';
const ALGOD_TOKEN = ''; //{ 'X-API-Key': 'VELyABA1dGqGbAVktbew4oACvp0c0298gMgYtYIb' }
const ALGOD_PORT='';


//------------------PUREISH METHODS--------------------------------

/**
 * Use single name for method
 * @deprecated
 * @returns {AlgodClient}
 */
function getLocalClientAndEnv() {
    //const algodClient = algodex.initAlgodClient("test");
    const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
    return algodClient;
}

/**
 *
 * @returns {Account}
 */
function getRandomAccount() {
    return algosdk.generateAccount();
}
/**
 * @param addr
 * @returns {Promise<any>}
 */
async function getAccountInfo(addr) {
    //return algodex.getAccountInfo(addr);

    // This is the old account info that uses algod, not the indexer
    // This is necessary for the tests to go faster as the indexer takes time to update.

    try {
        let port = (!!ALGOD_PORT) ? ':' + ALGOD_PORT : '';

        const response = await axios.get(ALGOD_SERVER + port +  "/v2/accounts/"+addr, {headers: {'X-Algo-API-Token': ALGOD_TOKEN}});
        //console.debug(response);
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error("getAccountInfo failed: ", error);
    }
}

/**
 *
 * @param client
 * @param fromAccount
 * @param toAccount
 * @returns {Promise<void>}
 */
async function closeAccount (client, fromAccount, toAccount) {
    console.log("checking account info for: " + fromAccount.addr)
    const fromAccountInfo = await getAccountInfo(fromAccount.addr);
    if (fromAccountInfo != null && fromAccountInfo['assets'] != null
        && fromAccountInfo['assets'].length > 0) {
        for (let i = 0; i < fromAccountInfo['assets'].length; i++) {
            let asset = fromAccountInfo['assets'][i];
            let assetId = asset['asset-id'];
            console.log("closing asset: " + assetId + " for account: " + fromAccount.addr);
            let txn = await transactionGenerator.getAssetSendTxn(client, fromAccount, toAccount, 0, assetId, true);
            let signedTxn = algosdk.signTransaction(txn, fromAccount.sk);
            await sendAndCheckPending(client, [signedTxn.blob]);
        }
    }

    const fundTxn = await transactionGenerator.getPayTxn(client, fromAccount, toAccount, 0, true);
    const fundTxnId = fundTxn.txID().toString();
    let signedTxn = fundTxn.signTxn(fromAccount.sk);
    console.log("Signed transaction with txID: %s", fundTxnId);
    // Submit the transaction
    try {
        await client.sendRawTransaction(signedTxn).do();
    } catch (e) {
        console.log({e});
    }
    await checkPending(client, fundTxnId);
}

/**
 *
 * @returns {Account}
 */
function getOpenAccount() {
    //WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI
    let mn = "mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above";
    let openAccount = algosdk.mnemonicToSecretKey(mn);
    return openAccount;
}

/**
 *
 * @param client
 * @param sender
 * @param appId
 * @returns {Promise<void>}
 */
async function deleteApplication (client, sender, appId) {
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
        console.log({e});
    }
    // display results
    let transactionResponse = await client.pendingTransactionInformation(txId).do();
    console.log("Deleted app-id: ",appId);
}

/**
 *
 * @returns {Account}
 */
function getExecuteAccount() {
    //UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A
    let mn = "three satisfy build purse lens another idle fashion base equal echo recall proof hill shadow coach early palm act wealth dawn menu portion above mystery";
    let executeAccount = algosdk.mnemonicToSecretKey(mn);
    return executeAccount;
}

/**
 *
 * @param algodClient
 * @param txId
 * @returns {Promise<void>}
 */
async function waitForConfirmation (algodClient, txId) {
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

/**
 *
 * @param algodClient
 * @param txId
 * @returns {Promise<void>}
 */
async function checkPending (algodClient, txId) {
    while (true) {
        const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
        if (pendingInfo != null && pendingInfo.txn != null && pendingInfo.txn.txn != null) {
            break;
        }
    }
}

//---------------------------- EXPORTS---------------------------------------------
module.exports = {
    /**
     * Use single name for method
     * @deprecated
     * @returns {AlgodClient}
     */
    getLocalClient: deprecate(getLocalClientAndEnv, {file:'./test/setup.js'}),
    /**
     * Use single name for method
     * @deprecated
     */
    getLocalClientAndEnv: deprecate(getLocalClientAndEnv),
    /**
     * @deprecated
     */
    getRandomAccount:deprecate(getRandomAccount, {file:'./test/setup.js'}),
    /**
     * @deprecated
     */
    getAccountInfo:deprecate(getAccountInfo, {file:'./test/setup.js'}),
    /**
     * @deprecated
     */
    getOpenAccount:deprecate(getOpenAccount, {file:'./test/setup.js'}),
    /**
     * @deprecated
     */
    closeAccount:deprecate(closeAccount, {file:'./test/setup.js'}),
    /**
     * @deprecated
     */
    deleteApplication:deprecate(deleteApplication, {file:'./test/setup.js'}),
    /**
     * @deprecated
     */
    getExecuteAccount:deprecate(getExecuteAccount, {file:'./test/setup.js'}),
    /**
     * @deprecated
     */
    waitForConfirmation:deprecate(waitForConfirmation, {file:'./test/setup.js'}),
    /**
     * @deprecated
     */
    checkPending:deprecate(checkPending, {file:'./test/setup.js'}),

    /**
     * @param outerTxns
     */
    printOuterTransactions(outerTxns) {
        for (let i = 0; i < outerTxns.length; i++ ) {
           console.log(outerTxns[i]);
        }
    },

    /**
     * @param error
     * @returns {boolean}
     */
    checkFailureType(error) {
        let hasKnownError = false;

        if (error != null && error.response && error.response.body && error.response.body.message != null) {
            const msg = error.response.body.message;
            if (msg.includes("rejected by logic err=assert failed")) {
                hasKnownError = true;
            } else if (msg.includes("TEAL runtime encountered err opcode")) {
                hasKnownError = true;
            } else if (msg.includes("rejected by logic err=gtxn lookup TxnGroup") && msg.includes("but it only has") ) {
                hasKnownError = true;
            } else if (msg.includes("logic eval error: assert failed")) {
                hasKnownError = true;
            } else {
                throw("Unknown error type: " + msg);
            }
        }

        return hasKnownError;
    },

    /**
     * @param client
     * @param fromAccount
     * @param toAccount
     * @param amount
     * @param assetId
     * @returns {Promise<void>}
     */
    async transferASA(client, fromAccount, toAccount, amount, assetId) {
        const asaTransferTxn = await transactionGenerator.getAssetSendTxn(client, fromAccount, toAccount, amount, assetId, false);
        const asaTxnId = asaTransferTxn.txID().toString();

        let signedFundTxn = asaTransferTxn.signTxn(fromAccount.sk);
        console.log("Signed transaction with txID: %s", asaTxnId);

        // Submit the transaction
        try {
            await client.sendRawTransaction(signedFundTxn).do();
        } catch (e) {
            console.log(JSON.stringify(e));
        }

        // Wait for confirmation
        await checkPending(client, asaTxnId);
    },

    /**
     * @param client
     * @param fromAccount
     * @param toAccount
     * @param amount
     * @returns {Promise<void>}
     */
    async transferFunds(client, fromAccount, toAccount, amount) {
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
        await checkPending(client, fundTxnId);
    },

    /**
     * @param client
     * @param signedTxns
     * @returns {Promise<void>}
     */
    async sendAndCheckConfirmed(client, signedTxns) {
        // Submit the transaction
        let txId = null;
        try {
            let sentTxns = await client.sendRawTransaction(signedTxns).do();
            txId = sentTxns.txId;
        } catch (e) {
            throw e;
        }
        // Wait for confirmation
        await waitForConfirmation(client, txId);
    },
    /**
     * @param client
     * @param signedTxns
     * @returns {Promise<void>}
     */
    async sendAndCheckPending(client, signedTxns) {
        // Submit the transaction
        let txId = null;
        try {
            let sentTxns = await client.sendRawTransaction(signedTxns).do();
            txId = sentTxns.txId;
        } catch (e) {
            throw e;
        }
        // Wait for confirmation
        await checkPending(client, txId);
    },

    /**
     * Note: this function is currently not used and has not been run before.
     * @param algodClient
     * @param makerAccount
     * @param price
     * @param assetId
     * @param isASAEscrow
     * @returns {Promise<*>}
     */
    async getOrderLsig(algodClient, makerAccount,
        price, assetId, isASAEscrow) {

        const orderCreatorAddr = makerAccount.addr;
        const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
        const n = numAndDenom.n;
        const d = numAndDenom.d;

        const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, isASAEscrow, constants.ESCROW_CONTRACT_VERSION);
        const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
        return lsig;
    },

    /**
     * @param accountAddr
     * @param assetId
     * @returns {Promise<null|*>}
     */
    async getAssetBalance(accountAddr, assetId) {
        console.log("checking account info for: " + accountAddr)
        const accountInfo = await getAccountInfo(accountAddr);
        if (accountInfo != null && accountInfo['assets'] != null
            && accountInfo['assets'].length > 0) {
            for (let i = 0; i < accountInfo['assets'].length; i++) {
                let asset = accountInfo['assets'][i];
                console.log({asset} );
                if (asset['asset-id'] == assetId) {
                    return asset['amount'];
                }
            }
        }
        return null;
    },


    /**
     * @param config
     * @param client
     * @param outerTxns
     * @param negTestTxnConfig
     * @returns {Promise<boolean>}
     */
    async runNegativeTest(config, client, outerTxns, negTestTxnConfig) {
        console.log("STARTING runNegativeTest");
        console.log({negTestTxnConfig});

        const {txnNum, field, val, negTxn, innerNum, configKeyForVal, txnKeyForVal, txnNumForVal} = negTestTxnConfig;
        const txn = outerTxns[txnNum];

        const getVal = () => {
            if (configKeyForVal !== undefined) {
                console.log({configKeyForVal, config});
                return config[configKeyForVal];
            }
            if (txnKeyForVal !== undefined) {
                return outerTxns[txnNumForVal].unsignedTxn[txnKeyForVal];
            }
            return val;
        }

        if (!negTxn) {
            if (innerNum === undefined) {
                outerTxns[txnNum].unsignedTxn[field] = getVal();
                if (txnKeyForVal === 'from' && field === 'from') {
                    delete outerTxns[txnNum].lsig;
                    delete outerTxns[txnNum].senderAcct;

                    if (outerTxns[txnNumForVal].lsig !== undefined) {
                        outerTxns[txnNum].lsig = outerTxns[txnNumForVal].lsig;
                    }
                    if (outerTxns[txnNumForVal].senderAcct !== undefined) {
                        outerTxns[txnNum].senderAcct = outerTxns[txnNumForVal].senderAcct;
                    }
                }
            } else {
                outerTxns[txnNum].unsignedTxn[field][innerNum] = getVal();
            }
        } else {
            outerTxns[txnNum] = negTxn;
        }
        //const t = outerTxns[0];
        console.log({txn});

        let signedTxns = groupAndSignTransactions(outerTxns);

        try {
            await sendAndCheckConfirmed(client, signedTxns);
        } catch (e) {
            // An exception is expected. Return true for success
            return checkFailureType(e);
        }

        return false;
    },

    /**
     * @param outerTxns
     * @returns {*[]}
     */
    groupAndSignTransactions(outerTxns) {
            console.log("inside signAndSend transactions");
            let txns = [];

            for (let i = 0; i < outerTxns.length; i++) {
                txns.push(outerTxns[i].unsignedTxn);
            }

            const groupID = algosdk.computeGroupID(txns);
            for (let i = 0; i < txns.length; i++) {
                txns[i].group = groupID;
            }

            for (let i = 0; i < outerTxns.length; i++) {
                let txn = outerTxns[i];
                if (txn.lsig != null) {
                    let signedLsig = algosdk.signLogicSigTransactionObject(txn.unsignedTxn, txn.lsig);
                    txn.signedTxn = signedLsig.blob;
                } else {
                    let signedTxn = algosdk.signTransaction(txn.unsignedTxn, txn.senderAcct.sk);
                    txn.signedTxn = signedTxn.blob;
                }
            }

            let signed = [];

            for (let i = 0; i < outerTxns.length; i++) {
                signed.push(outerTxns[i].signedTxn);
            }
            console.log("printing transaction debug");
            algodex.printTransactionDebug(signed);

            return signed;
    },
}
