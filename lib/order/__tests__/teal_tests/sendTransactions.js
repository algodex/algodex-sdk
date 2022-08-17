const algosdk = require('algosdk');

const _sendTransactions = async (client, signedTransactions) => {
  for (const group of signedTransactions) {
    console.debug(`Sending ${group.length} Group Transactions`);
    const rawTxns = group.map((txn) => txn.blob);

    const { txId } = await client.sendRawTransaction(rawTxns).do();
    console.debug(`Waiting for confirmation for ${txId}`);
    await algosdk.waitForConfirmation(client, txId, 10);
    console.debug(`Confirmed ${txId}`);
  }
};

module.exports = _sendTransactions;
