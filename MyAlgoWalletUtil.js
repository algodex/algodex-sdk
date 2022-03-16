
const constants = require('./constants.js');
const axios = require('axios').default;

let ALGOD_SERVER = 'https://node.testnet.algoexplorerapi.io';

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

exports.setAlgodServer = (algod_server) => {
    ALGOD_SERVER = algod_server;
}

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


exports.setTransactionFee = function(txn) {
    txn.fee = transactionParams["min-fee"];
	txn.flatFee = true;
};

