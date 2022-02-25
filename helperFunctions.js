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


const HelperFunctions = {
    assignGroups: function (txns) {
        const groupID = algosdk.computeGroupID(txns)
        for (let i = 0; i < txns.length; i++) {
            txns[i].group = groupID;
        }
    },
    groupBy:
        function (items, key) {
            return items.reduce(
                (result, item) => ({
                    ...result,
                    [item[key]]: [
                        ...(result[item[key]] || []),
                        item,
                    ],
                }),
                {},
            )

        },
    allSettled: function (promises) {
        let wrappedPromises = promises.map(p => Promise.resolve(p)
            .then(
                val => ({ status: 'promiseFulfilled', value: val }),
                err => ({ status: 'promiseRejected', reason: err })));
        return Promise.all(wrappedPromises);
    },
    printTransactionDebug: function printTransactionDebug(signedTxns) {
        console.debug('zzTxnGroup to debug:');
        const b64_encoded = Buffer.concat(signedTxns.map(txn => Buffer.from(txn))).toString('base64');

        console.debug(b64_encoded);
        //console.debug("DEBUG_SMART_CONTRACT_SOURCE: " + constants.DEBUG_SMART_CONTRACT_SOURCE);
        if (constants.DEBUG_SMART_CONTRACT_SOURCE == 1 && constants.INFO_SERVER != "") {
            (async () => {
                try {
                    console.debug("trying to inspect");
                    const response = await axios.post(constants.INFO_SERVER + '/inspect/unpack', {

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
                    "/v2/transactions/" + txId, { headers: { 'X-Algo-API-Token': ALGOD_INDEXER_TOKEN } });

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
module.exports = HelperFunctions;