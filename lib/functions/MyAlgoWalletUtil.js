
const constants = require('../constants.js');
const deprecate = require('./deprecate');
const axios = require('axios').default;

let ALGOD_SERVER = 'https://node.testnet.algoexplorerapi.io';

/**
 *
 * @param txn
 * @returns {Promise<*>}
 * @deprecated
 */
exports.connectToWallet = async function(txn) {
    try {
        console.debug("connecting...");
        console.debug(myAlgoWallet);
        accounts = await myAlgoWallet.connect();

        const addresses = accounts.map(account => account.address);
        return addresses;
    } catch (err) {
        console.error(err);
    }

};

/**
 *
 * @param algod_server
 * @deprecated
 */
exports.setAlgodServer = (algod_server) => {
    ALGOD_SERVER = algod_server;
}

/**
 *
 * @returns {Promise<any>}
 * @deprecated
 */
const getParams = async() => {
    try {
        const response = await axios.get(ALGOD_SERVER + '/v2/transactions/params');
        //console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error("getAccountInfo failed: ", error);
    }

}



let transactionParams = null;

(async () => {
    transactionParams = await getParams();
})().catch(err => {
    console.error(err);
});

/**
 * @deprecated
 * @param txn
 */
exports.setTransactionFee = function(txn) {
    txn.fee = transactionParams["min-fee"];
	txn.flatFee = true;
};

/**
 * Export of deprecated functions
 */
Object.keys(exports).forEach(( key)=>{
    exports[key] = deprecate(exports[key], {file:'MyAlgoWalletUtil.js'})
})
