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
 * @param {number} length
 * @return {String}
 */
function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() *
 charactersLength));
  }
  return result;
}
/**
 *
 * @param {object} assetCreator
 * @param {number} decimals
 * @return {Promise<void>}
 */
async function generateAsset(assetCreator, decimals=6) {
  const params = await client.getTransactionParams().do();

  const createAssetTxn = algosdk.makeAssetCreateTxnWithSuggestedParams(
      assetCreator.addr,
      undefined, // no note for time being
      10000000, // hardCoded issuance for time being
      decimals, // hardCoded decimals for time
      false,
      assetCreator.addr,
      undefined,
      assetCreator.addr,
      assetCreator.addr,
      makeid(7),
      makeid(7),
      undefined,
      undefined,
      params);

  const rawSignedTxn = createAssetTxn.signTxn(assetCreator.sk);
  const txn = (await client.sendRawTransaction(rawSignedTxn).do());
  const ptx = await algosdk.waitForConfirmation(client, txn.txId, 4);
  const assetId = ptx['asset-index'];

  return assetId;
}

module.exports = generateAsset;

