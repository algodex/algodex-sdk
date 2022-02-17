const algosdk = require('algosdk');
const { formatJsonRpcRequest } = require("@json-rpc-tools/utils");
const constants = require('./constants.js');
let MyAlgo = null;
let myAlgoWalletUtil = null;
if (typeof window != 'undefined') {
    MyAlgo = require('@randlabs/myalgo-connect');
    myAlgoWalletUtil = require('./MyAlgoWalletUtil.js');
}

if (MyAlgo != null) {
    myAlgoWallet = new MyAlgo();
    // console.debug("printing my algo wallet");
    // console.debug(myAlgoWallet)
}

const SigningApi = {
    propogateTransactions:
        async function (algodClient, outerTxns) {
          
           let groupNumCheck = outerTxns[0]
      
            if(!Object.keys(groupNumCheck).includes("groupNum")) {
               
                const rawTransaction = outerTxns.map(entry => entry.signedTxn)
               
                let tx = await algodClient.sendRawTransaction(rawTransaction).do();
                return tx
            }
           
            let lastGroupNum = -1;
            let signedTxns = []
            let sentTxns = [];
            for (let i = 0; i < outerTxns.length; i++) {  // loop to end of array 
                
                if (lastGroupNum != outerTxns[i]['groupNum']) {
                  
                    // If at beginning of new group, send last batch of transactions
                    if (signedTxns.length > 0) {
                        try {
                            this.printTransactionDebug(signedTxns);
                            let txn = await algodClient.sendRawTransaction(signedTxns).do();
                            sentTxns.push(txn.txId);
                            console.debug("sent: " + txn.txId);
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                    // send batch of grouped transactions
                    signedTxns = [];
                    lastGroupNum = outerTxns[i]['groupNum'];
                }

                signedTxns.push(outerTxns[i]['signedTxn']);
              

                if (i == outerTxns.length - 1) {
                    // If at end of list send last batch of transactions
                    if (signedTxns.length > 0) {
                        try {
                            this.printTransactionDebug(signedTxns);
                            const DO_SEND = true;
                            if (DO_SEND) {
                                let txn = await algodClient.sendRawTransaction(signedTxns).do();
                                sentTxns.push(txn.txId);
                                console.debug("sent: " + txn.txId);
                            } else {
                                console.debug("skipping sending for debugging reasons!!!");
                            }
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                    break;
                }

            }
            console.debug("going to wait for confirmations");
       

            let waitConfirmedPromises = [];

            for (let i = 0; i < sentTxns.length; i++) {
                console.debug("creating promise to wait for: " + sentTxns[i]);
                const confirmPromise = this.waitForConfirmation(sentTxns[i]);
                waitConfirmedPromises.push(confirmPromise);
            }

            console.debug("final9 trans are: ");
           
            // console.debug(alTransList);
            // console.debug(transNeededUserSigList);

            console.debug("going to send all ");

            let confirmedTransactions = await this.allSettled(waitConfirmedPromises);

            let transResults = JSON.stringify(confirmedTransactions, null, 2);
       
            console.debug("trans results after confirmed are: ");
            console.debug(transResults);
            // await this.waitForConfirmation(algodClient, txn.txId);
            return;


        },
    assignGroups: function (txns) {
        const groupID = algosdk.computeGroupID(txns)
        for (let i = 0; i < txns.length; i++) {
            txns[i].group = groupID;
        }
    },
    signMyAlgoTransactions:
        async function (outerTxns) {
            console.debug("inside signAndSend transactions");
            let txnsForSig = [];
            let txns = [];

            for (let i = 0; i < outerTxns.length; i++) {
                txns.push(outerTxns[i].unsignedTxn);
                if (outerTxns[i].needsUserSig == true) {
                    txnsForSig.push(outerTxns[i].unsignedTxn);
                }
            }

            this.assignGroups(txns);

            let signedTxnsFromUser = await myAlgoWallet.signTransaction(txnsForSig);

            if (Array.isArray(signedTxnsFromUser)) {
                let userSigIndex = 0;
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser[userSigIndex].blob;
                        userSigIndex++;
                    }
                }
            } else {
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser.blob;
                        break;
                    }
                }
            }

            for (let i = 0; i < outerTxns.length; i++) {
                if (!outerTxns[i].needsUserSig) {
                    let signedLsig = await algosdk.signLogicSigTransactionObject(outerTxns[i].unsignedTxn, outerTxns[i].lsig);
                    outerTxns[i].signedTxn = signedLsig.blob;
                }
            }
            return outerTxns
        },
    signMyAlgo:
        async function signMyAlgo(algodClient, outerTxns) {
            const needsUserSig = outerTxns.filter(transaction => !!transaction.unsignedTxn).map(transaction => transaction.unsignedTxn)
            // myAlgo userSigning doesn't want lSIGS. This will go away when we remove the signing of LSIGS from the structure order helper functions.

            let signedTxnsFromUser = await myAlgoWallet.signTransaction(needsUserSig);

            if (Array.isArray(signedTxnsFromUser)) {
                let userSigIndex = 0;
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser[userSigIndex].blob;
                        userSigIndex++;
                    }
                }
            } else {
                for (let i = 0; i < outerTxns.length; i++) {
                    if (outerTxns[i].needsUserSig) {
                        outerTxns[i].signedTxn = signedTxnsFromUser.blob;
                        break;
                    }
                }
            }

            return outerTxns
        },
    allSettled: function (promises) {
        let wrappedPromises = promises.map(p => Promise.resolve(p)
            .then(
                val => ({ status: 'promiseFulfilled', value: val }),
                err => ({ status: 'promiseRejected', reason: err })));
        return Promise.all(wrappedPromises);
    },

    signWalletConnectTransactions:
        async function (algodClient, outerTxns, params, walletConnector) {
            const groupBy = (items, key) => items.reduce(
                (result, item) => ({
                    ...result,
                    [item[key]]: [
                        ...(result[item[key]] || []),
                        item,
                    ],
                }),
                {},
            );
            
            const groups = groupBy(outerTxns, "groupNum");

            let numberOfGroups = Object.keys(groups);

            const groupedGroups = numberOfGroups.map(group => {

                const allTxFormatted = (groups[group].map(txn => {
                    if (!txn.unsignedTxn.name) {
                        if (txn.unsignedTxn.type === "pay") { return algosdk.makePaymentTxnWithSuggestedParams(txn.unsignedTxn.from, txn.unsignedTxn.to, txn.unsignedTxn.amount, undefined, undefined, params) }
                        if (txn.unsignedTxn.type === "axfer") { return algosdk.makeAssetTransferTxnWithSuggestedParams(txn.unsignedTxn.from, txn.unsignedTxn.to, undefined, undefined, txn.unsignedTxn.amount, undefined, txn.unsignedTxn.assetIndex, params) }
                    } else {
                        return txn.unsignedTxn;
                    }
                }))
                algosdk.assignGroupID(allTxFormatted.map(toSign => toSign));
                return allTxFormatted;
            }
            )

            const txnsToSign = groupedGroups.map(group => {
                const encodedGroup = group.map(txn => {
                    const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
                    if (algosdk.encodeAddress(txn.from.publicKey) !== walletConnector.connector.accounts[0]) return { txn: encodedTxn, signers: [] };
                    return { txn: encodedTxn };
                })
                return encodedGroup;
            })

            const formattedTxn = txnsToSign.flat();

            const request = formatJsonRpcRequest("algo_signTxn", [formattedTxn]);

            const result = await walletConnector.connector.sendCustomRequest(request);


            let resultsFormattted = result.map((element, idx) => {
                return element ? {
                    txID: formattedTxn[idx].txn,
                    blob: new Uint8Array(Buffer.from(element, "base64"))
                } : {
                    ...algosdk.signLogicSigTransactionObject(outerTxns[idx].unsignedTxn, outerTxns[idx].lsig)
                };
            });

            let orderedRawTransactions = resultsFormattted.map(obj => obj.blob);

            for (let i = 0; i < outerTxns.length; i++) {
                outerTxns[i]['signedTxn'] = orderedRawTransactions[i];
            }

            return outerTxns;
        },

    printTransactionDebug: function printTransactionDebug(signedTxns) {
        console.debug('zzTxnGroup to debug:');
        const b64_encoded = Buffer.concat(signedTxns.map(txn => Buffer.from(txn))).toString('base64');

        console.debug(b64_encoded);
        //console.debug("DEBUG_SMART_CONTRACT_SOURCE: " + constants.DEBUG_SMART_CONTRACT_SOURCE);
        if (constants.DEBUG_SMART_CONTRACT_SOURCE == 1 && constants.INFO_SERVER != "") {
            (async() => {
                try {
                    console.debug("trying to inspect");
                    const response = await axios.post(constants.INFO_SERVER +  '/inspect/unpack', {
                    
                            msgpack: b64_encoded,
                            responseType: 'text/plain',
                        },
                    );
                    console.debug(response.data);
                    return response.data;
                } catch (error) {
                    console.error("Could not print out transaction details: " + error);
                }
            })();
        }
    },

    waitForConfirmation: async function (txId) {
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        const maxLoops = 25;
        let loopCount = 0;

        while (loopCount < maxLoops) {
            // Check the pending transactions
            let port = (!!ALGOD_INDEXER_PORT) ? ':' + ALGOD_INDEXER_PORT : '';
            let response = null;
            let isError = false;

            try {
                response = await axios.get(ALGOD_INDEXER_SERVER + port + 
                    "/v2/transactions/"+txId, {headers: {'X-Algo-API-Token': ALGOD_INDEXER_TOKEN}});

            } catch (e) {
                isError = true;
            }
            if (response == null || response.data == null || response.data.transaction == null) {
                isError = true;
            }

            if (!isError) {
                const txnInfo = response.data.transaction;
              
                if (txnInfo["confirmed-round"] !== null && txnInfo["confirmed-round"] > 0) {
                    // Got the completed Transaction
                    console.debug(`Transaction ${txId} confirmed in round ${txnInfo["confirmed-round"]}`);
                    return {
                        txId,
                        status: "confirmed",
                        statusMsg: `Transaction confirmed in round ${txnInfo["confirmed-round"]}`,
                        transaction: txnInfo
                    };
                }
                if (txnInfo["pool-error"] !== null && txnInfo["pool-error"].length > 0) {
                    // transaction has been rejected
                    return {
                        txId,
                        status: "rejected",
                        statusMsg: 'Transaction rejected due to pool error',
                        transaction: txnInfo
                    };
                }

            }

            await sleep(1000); // sleep a second
            loopCount++;
        }

        throw new Error(`Transaction ${txId} timed out`);
    },



}

module.exports = SigningApi;