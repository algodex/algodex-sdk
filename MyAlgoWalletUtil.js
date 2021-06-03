
exports.connectToWallet = async function(txn) {
    try {
        accounts = await myAlgoWallet.connect();

        const addresses = accounts.map(account => account.address);
        return addresses;
    } catch (err) {
        console.error(err);
    }

};


exports.setTransactionFee = function(txn) {
    txn.fee = transactionParams["min-fee"];
	txn.flatFee = true;
};

