const algoOrderBookSource = require('../templates/ALGO_Orderbook.teal');
const asaOrderBookSource = require('../templates/ASA_Orderbook.teal');
const clearProgramSource = require('../templates/ClearProgram.teal');
const {compileProgram} = require('../compile');
const algosdk = require('algosdk');

/**
 * # 🏗 Application Create Transaction
 *
 * @param {Algodv2} client Algorand SDK Client
 * @param {Account} creatorAccount Creator Account
 * @param {boolean} [isAlgoEscrowApp] Flag for is Algo Escrow
 * @param {boolean} [useBlankSource] Flag to use Blank Source
 * @param {Object} [_params] Optional Params
 * @return {Promise<Transaction>}
 * @memberOf module:teal/txns
 */
async function makeApplicationCreateTxn(
    client,
    creatorAccount,
    isAlgoEscrowApp = true,
    useBlankSource = false,
    _params,
) {
  // define sender as creator
  let approvalProgramSource = null;

  if (useBlankSource) {
    approvalProgramSource = `#pragma version 4
                                        int 1
                                        return`;
  } else if (isAlgoEscrowApp) {
    approvalProgramSource = algoOrderBookSource;
  } else {
    approvalProgramSource = asaOrderBookSource;
  }

  // declare application state storage (immutable)
  const localInts = 2;
  const localBytes = 1;
  const globalInts = 0;
  const globalBytes = 1;

  const sender = creatorAccount.addr;

  // declare onComplete as NoOp
  const onComplete = algosdk.OnApplicationComplete.NoOpOC;

  // get node suggested parameters
  const params = typeof _params !== 'undefined' ? _params :
    await client.getTransactionParams().do();
  // create unsigned transaction

  const approvalProgram = await compileProgram(client, approvalProgramSource);
  const clearProgram = await compileProgram(client, clearProgramSource);

  return algosdk.makeApplicationCreateTxn(sender, params, onComplete,
      approvalProgram, clearProgram,
      localInts, localBytes, globalInts, globalBytes);
}

module.exports = makeApplicationCreateTxn;
