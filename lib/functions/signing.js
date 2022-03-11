const algosdk = require('algosdk');
const { formatJsonRpcRequest } = require("@json-rpc-tools/utils");
const constants = require('./constants.js');
const helperFuncs = require('./helperFunctions.js')
const deprecate = require('./lib/functions/deprecate');
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
    /**
     *
     * @param algodClient
     * @param outerTxns
     * @returns {Promise<*>}
     * @deprecated
     */
   async propogateTransactions(algodClient, outerTxns){

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
                            helperFuncs.printTransactionDebug(signedTxns);
                            let txn = await algodClient.sendRawTransaction(signedTxns).do();
                            sentTxns.push(txn.txId);
                            console.debug("sent: " + txn.txId);
                        } catch (e) {
                            debugger
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
                            helperFuncs.printTransactionDebug(signedTxns);
                            const DO_SEND = true;
                            if (DO_SEND) {
                                let txn = await algodClient.sendRawTransaction(signedTxns).do();
                                sentTxns.push(txn.txId);
                                console.debug("sent: " + txn.txId);
                            } else {
                                console.debug("skipping sending for debugging reasons!!!");
                            }
                        } catch (e) {
                            debugger
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
                const confirmPromise = helperFuncs.waitForConfirmation(sentTxns[i]);
                waitConfirmedPromises.push(confirmPromise);
            }

            console.debug("final9 trans are: ");

            console.debug("going to send all ");

            let confirmedTransactions = await helperFuncs.allSettled(waitConfirmedPromises);

            let transResults = JSON.stringify(confirmedTransactions, null, 2);

            console.debug("trans results after confirmed are: ");
            console.debug(transResults);
            return;
        },
    /**
     *
     * @param outerTxns
     * @returns {Promise<*>}
     * @deprecated
     */
    async signMyAlgoTransactions (outerTxns) {
            console.debug("inside signMyAlgoTransactions transactions");

            const groups = helperFuncs.groupBy(outerTxns, "groupNum")

            let numberOfGroups = Object.keys(groups);

            const groupedGroups = numberOfGroups.map(group => {

                const allTxFormatted = (groups[group].map(txn => {
                        return txn.unsignedTxn;
                }))
                helperFuncs.assignGroups(allTxFormatted);
                return allTxFormatted;
            }
            )


            const flattenedGroups = groupedGroups.flat();

            let txnsForSig = []

              for (let i = 0; i < outerTxns.length; i++) {
                outerTxns[i].unsignedTxn = flattenedGroups[i];
                if (outerTxns[i].needsUserSig == true) {
                    txnsForSig.push(flattenedGroups[i]);
                }
            }

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
    /**
     *
     * @param algodClient
     * @param outerTxns
     * @returns {Promise<*>}
     */
    async signMyAlgo(algodClient, outerTxns) {
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

    /**
     *
     * @param algodClient
     * @param outerTxns
     * @param params
     * @param walletConnector
     * @returns {Promise<*>}
     * @deprecated
     */
    async signWalletConnectTransactions (algodClient, outerTxns, params, walletConnector) {
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
                        if (txn.unsignedTxn.type === "pay") {
                            return algosdk.makePaymentTxnWithSuggestedParams(txn.unsignedTxn.from, txn.unsignedTxn.to, txn.unsignedTxn.amount, undefined, undefined, params)
                        }
                        if (txn.unsignedTxn.type === "axfer") {
                            return algosdk.makeAssetTransferTxnWithSuggestedParams(txn.unsignedTxn.from, txn.unsignedTxn.to, undefined, undefined, txn.unsignedTxn.amount, undefined, txn.unsignedTxn.assetIndex, params)
                        }
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
}



module.exports = SigningApi;
