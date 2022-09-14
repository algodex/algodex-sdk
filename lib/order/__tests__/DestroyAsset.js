const algosdk = require('algosdk');
const ALGOD_SERVER = 'https://node.testnet.algoexplorerapi.io';
const ALGOD_TOKEN = ''; // { 'X-API-Key': 'VELyABA1dGqGbAVktbew4oACvp0c0298gMgYtYIb' }
const ALGOD_PORT = '';

const client = new algosdk.Algodv2(
    ALGOD_TOKEN,
    ALGOD_SERVER,
    ALGOD_PORT,
);
/**
 *
 * @param {object} assetCreator
 * @param {string} assetId
 * @return {Promise<void>}
 */
async function destroyAsset(assetCreator, assetId) {
  const params = await client.getTransactionParams().do();

  const dtxn = algosdk.makeAssetDestroyTxnWithSuggestedParams(
      assetCreator.addr,
      undefined,
      assetId,
      params);

  const rawSignedTxn = dtxn.signTxn(assetCreator.sk);
  const txn = (await client.sendRawTransaction(rawSignedTxn).do());
  const confirmedTxn = await algosdk.waitForConfirmation(client, txn.txId, 4);
  console.log(confirmedTxn);

  console.log('asset destroyed');
}

module.exports = destroyAsset;

