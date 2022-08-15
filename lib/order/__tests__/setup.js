const http = require('http');
const algosdk = require('algosdk');
const axios = require('axios').default;
const signer = require('../../wallet/signers/AlgoSDK');

// const algoDelegateTemplate = require('./algo_delegate_template_teal.js');
// const asaDelegateTemplate = require('./ASA_delegate_template_teal.js');
// const algoOrderBook = require('./dex_teal.js');
// const asaOrderBook = require('./asa_dex_teal.js');

// //require('./dex_teal.js');
// const dexInternal = require('./algodex_internal_api.js');
// const algodex = require('../../AlgodexApi.js');
// TODO: need to replace this with v2.
// const constants = require('./constants.js');
// const transactionGenerator = require('./generate_transaction_types.js');

// const ALGO_ESCROW_ORDER_BOOK_ID = -1;
// const ASA_ESCROW_ORDER_BOOK_ID = -1;

const ALGOD_SERVER = 'https://node.testnet.algoexplorerapi.io';
const ALGOD_TOKEN = ''; // { 'X-API-Key': 'VELyABA1dGqGbAVktbew4oACvp0c0298gMgYtYIb' }
const ALGOD_PORT = '';

const TestHelper = {
  getLocalClient: function getLocalClientAndEnv() {
    // const algodClient = algodex.initAlgodClient("test");
    const algodClient = new algosdk.Algodv2(
      ALGOD_TOKEN,
      ALGOD_SERVER,
      ALGOD_PORT
    );
    return algodClient;
  },

  getRandomAccount: function getRandomAccount() {
    return algosdk.generateAccount();
  },

  getAccountInfo: async function getAccountInfo(addr) {
    return algodex.getAccountInfo(addr);

    // This is the old account info that uses algod, not the indexer
    // This is necessary for the tests to go faster as the indexer takes time to update.

    /* try {
            let port = (!!ALGOD_PORT) ? ':' + ALGOD_PORT : '';
            const response = await axios.get(ALGOD_SERVER + port +  "/v2/accounts/"+addr, {headers: {'X-Algo-API-Token': ALGOD_TOKEN}});
            //console.debug(response);
            return response.data;
        } catch (error) {
            console.error(error);
            throw new Error("getAccountInfo failed: ", error);
        }*/
  },

  printOuterTransactions: function (outerTxns) {
    for (let i = 0; i < outerTxns.length; i++) {
      console.log(outerTxns[i]);
    }
  },

  checkFailureType: function (error) {
    let hasKnownError = false;

    if (error != null && error.response.body.message != null) {
      const msg = error.response.body.message;
      if (msg.includes('rejected by logic err=')) {
        hasKnownError = true;
      } else if (msg.includes('TEAL runtime encountered err opcode')) {
        hasKnownError = true;
      } else {
        throw 'Unknown error type: ' + msg;
      }
    }

    return hasKnownError;
  },

  getOpenAccount: function getOpenAccount() {
    // WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI
    const mn =
      'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above';
    const openAccount = algosdk.mnemonicToSecretKey(mn);
    return openAccount;
  },

  //   transferASA: async function (
  //     client,
  //     fromAccount,
  //     toAccount,
  //     amount,
  //     assetId
  //   ) {
  //     const asaTransferTxn = await transactionGenerator.getAssetSendTxn(
  //       client,
  //       fromAccount,
  //       toAccount,
  //       amount,
  //       assetId,
  //       false
  //     );
  //     const asaTxnId = asaTransferTxn.txID().toString();

  //     const signedFundTxn = asaTransferTxn.signTxn(fromAccount.sk);
  //     console.log('Signed transaction with txID: %s', asaTxnId);

  //     // Submit the transaction
  //     try {
  //       await client.sendRawTransaction(signedFundTxn).do();
  //     } catch (e) {
  //       console.log(JSON.stringify(e));
  //     }

  //     // Wait for confirmation
  //     await this.checkPending(client, asaTxnId);
  //   },

  //   transferFunds: async function (client, fromAccount, toAccount, amount) {
  //     const fundTxn = await transactionGenerator.getPayTxn(
  //       client,
  //       fromAccount,
  //       toAccount,
  //       amount,
  //       false
  //     );
  //     const fundTxnId = fundTxn.txID().toString();

  //     const signedFundTxn = fundTxn.signTxn(fromAccount.sk);
  //     console.log('Signed transaction with txID: %s', fundTxnId);

  //     // Submit the transaction
  //     try {
  //       await client.sendRawTransaction(signedFundTxn).do();
  //     } catch (e) {
  //       console.log(JSON.stringify(e));
  //     }

  //     // Wait for confirmation
  //     await this.checkPending(client, fundTxnId);
  //   },

  //   sendAndCheckConfirmed: async function (client, signedTxns) {
  //     // Submit the transaction
  //     let txId = null;
  //     try {
  //       const sentTxns = await client.sendRawTransaction(signedTxns).do();
  //       txId = sentTxns.txId;
  //     } catch (e) {
  //       throw e;
  //     }
  //     // Wait for confirmation
  //     await this.waitForConfirmation(client, txId);
  //   },
  //   sendAndCheckPending: async function (client, signedTxns) {
  //     // Submit the transaction
  //     let txId = null;
  //     try {
  //       const sentTxns = await client.sendRawTransaction(signedTxns).do();
  //       txId = sentTxns.txId;
  //     } catch (e) {
  //       throw e;
  //     }
  //     // Wait for confirmation
  //     await this.checkPending(client, txId);
  //   },

  //   getAssetBalance: async function (accountAddr, assetId) {
  //     console.log('checking account info for: ' + accountAddr);
  //     const accountInfo = await this.getAccountInfo(accountAddr);
  //     if (
  //       accountInfo != null &&
  //       accountInfo['assets'] != null &&
  //       accountInfo['assets'].length > 0
  //     ) {
  //       for (let i = 0; i < accountInfo['assets'].length; i++) {
  //         const asset = accountInfo['assets'][i];
  //         console.log({ asset });
  //         if (asset['asset-id'] == assetId) {
  //           return asset['amount'];
  //         }
  //       }
  //     }
  //     return null;
  //   },

  //   closeAccount: async function closeAccount(client, fromAccount, toAccount) {
  //     console.log('checking account info for: ' + fromAccount.addr);
  //     const fromAccountInfo = await this.getAccountInfo(fromAccount.addr);
  //     if (
  //       fromAccountInfo != null &&
  //       fromAccountInfo['assets'] != null &&
  //       fromAccountInfo['assets'].length > 0
  //     ) {
  //       for (let i = 0; i < fromAccountInfo['assets'].length; i++) {
  //         const asset = fromAccountInfo['assets'][i];
  //         const assetId = asset['asset-id'];
  //         console.log(
  //           'closing asset: ' + assetId + ' for account: ' + fromAccount.addr
  //         );
  //         const txn = await transactionGenerator.getAssetSendTxn(
  //           client,
  //           fromAccount,
  //           toAccount,
  //           0,
  //           assetId,
  //           true
  //         );
  //         const signedTxn = algosdk.signTransaction(txn, fromAccount.sk);
  //         await this.sendAndCheckPending(client, [signedTxn.blob]);
  //       }
  //     }

  //     const fundTxn = await transactionGenerator.getPayTxn(
  //       client,
  //       fromAccount,
  //       toAccount,
  //       0,
  //       true
  //     );
  //     const fundTxnId = fundTxn.txID().toString();
  //     const signedTxn = fundTxn.signTxn(fromAccount.sk);
  //     console.log('Signed transaction with txID: %s', fundTxnId);
  //     // Submit the transaction
  //     try {
  //       await client.sendRawTransaction(signedTxn).do();
  //     } catch (e) {
  //       console.log(JSON.stringify(e));
  //     }
  //     await this.checkPending(client, fundTxnId);
  //   },

  //   deleteApplication: async function deleteApplication(client, sender, appId) {
  //     // create unsigned transaction
  //     const params = await client.getTransactionParams().do();
  //     const txn = algosdk.makeApplicationDeleteTxn(sender.addr, params, appId);

  //     // sign, send, await
  //     const signedTxn = txn.signTxn(sender.sk);
  //     const txId = txn.txID().toString();

  //     console.log('Signed transaction with txID: %s', txId);
  //     // Submit the transaction
  //     try {
  //       await client.sendRawTransaction(signedTxn).do();
  //     } catch (e) {
  //       console.log(JSON.stringify(e));
  //     }
  //     // display results
  //     const transactionResponse = await client
  //       .pendingTransactionInformation(txId)
  //       .do();
  //     console.log('Deleted app-id: ', appId);
  //   },

  //   getExecuteAccount: function getExecuteAccount() {
  //     // UUEUTRNQY7RUXESXRDO7HSYRSJJSSVKYVB4DI7X2HVVDWYOBWJOP5OSM3A
  //     const mn =
  //       'three satisfy build purse lens another idle fashion base equal echo recall proof hill shadow coach early palm act wealth dawn menu portion above mystery';
  //     const executeAccount = algosdk.mnemonicToSecretKey(mn);
  //     return executeAccount;
  //   },

  // helper function to await transaction confirmation
  //   waitForConfirmation: async function waitForConfirmation(algodClient, txId) {
  //     const status = await algodClient.status().do();
  //     let lastRound = status['last-round'];
  //     while (true) {
  //       const pendingInfo = await algodClient
  //         .pendingTransactionInformation(txId)
  //         .do();
  //       if (
  //         pendingInfo['confirmed-round'] !== null &&
  //         pendingInfo['confirmed-round'] > 0
  //       ) {
  //         // Got the completed Transaction
  //         console.log(
  //           'Transaction ' +
  //             txId +
  //             ' confirmed in round ' +
  //             pendingInfo['confirmed-round']
  //         );
  //         break;
  //       }
  //       lastRound++;
  //       await algodClient.statusAfterBlock(lastRound).do();
  //     }
  //   },

  // helper function to await transaction confirmation
  //   checkPending: async function checkPending(algodClient, txId) {
  //     while (true) {
  //       const pendingInfo = await algodClient
  //         .pendingTransactionInformation(txId)
  //         .do();
  //       if (
  //         pendingInfo != null &&
  //         pendingInfo.txn != null &&
  //         pendingInfo.txn.txn != null
  //       ) {
  //         break;
  //       }
  //     }
  //   },

  //   groupAndSignTransactions: function (outerTxns) {
  //     console.log('inside signAndSend transactions');
  //     const txns = [];

  //     for (let i = 0; i < outerTxns.length; i++) {
  //       txns.push(outerTxns[i].unsignedTxn);
  //     }

  //     const groupID = algosdk.computeGroupID(txns);
  //     for (let i = 0; i < txns.length; i++) {
  //       txns[i].group = groupID;
  //     }

  //     for (let i = 0; i < outerTxns.length; i++) {
  //       const txn = outerTxns[i];
  //       if (txn.lsig != null) {
  //         const signedLsig = algosdk.signLogicSigTransactionObject(
  //           txn.unsignedTxn,
  //           txn.lsig
  //         );
  //         txn.signedTxn = signedLsig.blob;
  //       } else {
  //         const signedTxn = algosdk.signTransaction(
  //           txn.unsignedTxn,
  //           txn.senderAcct.sk
  //         );
  //         txn.signedTxn = signedTxn.blob;
  //       }
  //     }

  //     const signed = [];

  //     for (let i = 0; i < outerTxns.length; i++) {
  //       signed.push(outerTxns[i].signedTxn);
  //     }
  //     console.log('printing transaction debug');
  //     algodex.printTransactionDebug(signed);

  //     return signed;
  //   },
};

module.exports = TestHelper;
