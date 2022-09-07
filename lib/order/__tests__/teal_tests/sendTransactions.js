const algosdk = require('algosdk');

const _sendTransactions = async (client, signedTransactions) => {
  const sentRawTxnIdArr = [];

  for (const group of signedTransactions) {
    const rawTxns = group.map((txn) => txn.blob);
    try {
      const {txId} = await client.sendRawTransaction(rawTxns).do();
      sentRawTxnIdArr.push(txId);
    } catch (e) {
      console.log(e);
    }
  }

  await Promise.all(sentRawTxnIdArr.map((txId) => algosdk.waitForConfirmation(client, txId, 10 )));
};

module.exports = _sendTransactions;
