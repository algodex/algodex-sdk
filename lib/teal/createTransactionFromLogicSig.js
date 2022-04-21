const algosdk = require('algosdk');
const getTransactionParams = require('./getTransactionParams');

/**
 * Transaction Factory from LogicSigAccount
 *
 * @param {algosdk.Algodv2} client Algorand Client
 * @param {'appNoOp'|'appOptIn'} txnType Type of Transaction
 * @param {algosdk.LogicSigAccount} lsig Logic Signature Account
 * @param {algosdk.SuggestedParams} suggestedParams Suggested Parameters
 * @param {number} appIndex the ID of the app to use
 * @param {Array<Uint8Array>} [appArgs] Array of Uint8Array, any additional arguments to the application
 * @return {Promise<Transaction>}
 */
async function createTransactionFromLogicSig(
    client,
    txnType,
    lsig,
    suggestedParams,
    appIndex,
    appArgs,
) {
  /**
   * Types of Transactions
   * @type {string['appNoOp'|'appOptIn']}
   * @private
   */
  const _txnTypes = ['appNoOp', 'appOptIn'];

  if (typeof txnType !== 'string' || !_txnTypes.includes(txnType)) {
    throw new TypeError(`Invalid transaction type! Must be one of: ${_txnTypes}`);
  }

  if (!(lsig instanceof algosdk.LogicSigAccount)) {
    throw new TypeError('Must be valid LogicSigAccount');
  }


  /**
   * Lsig Account Address
   * @type {string}
   * @private
   */
  const _from = lsig.address();

  /**
   * Suggested Parameters
   * @type {algosdk.SuggestedParams}
   * @private
   */
  const _suggestedParams = await getTransactionParams(client, suggestedParams, true);


  let txn;

  if (txnType === 'appNoOp') {
    /**
     * No Op Transaction
     * @type {Transaction}
     */
    txn = algosdk.makeApplicationNoOpTxn(
        _from,
        _suggestedParams,
        appIndex,
        appArgs,
    );
  }

  if (txnType === 'appOptIn') {
    /**
     * Application Opt In Transaction
     * @type {Transaction}
     */
    txn = algosdk.makeApplicationOptInTxn(
        _from,
        _suggestedParams,
        appIndex,
        appArgs,
    );
  }

  if (typeof txn === 'undefined') {
    throw Error('Something went wrong!');
  }
  return txn;
}
module.exports = createTransactionFromLogicSig;
