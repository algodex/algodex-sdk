const algosdk = require('algosdk');

/**
 *
 * @param {LogicSignature} lsig Logic Signature
 * @param {number} AppID Application ID
 * @param {*} appArgs Transaction Arguments
 * @param {("appNoOp"|"appOptIn")} transType Transaction Type
 * @param {*} params Suggested Params
 * @return {Transaction}
 */
function makeTransactionFromLogicSig(
    lsig,
    AppID,
    appArgs,
    transType,
    params,
) {
  // define sender
  const sender = lsig.address();

  // create unsigned transaction
  let txn;
  if (transType === 'appNoOp') {
    txn = algosdk.makeApplicationNoOpTxn(sender, params, AppID, appArgs);
  } else if (transType === 'appOptIn') {
    txn = algosdk.makeApplicationOptInTxn(
        lsig.address(),
        params,
        AppID,
        appArgs,
    );
  }

  return txn;
}
module.exports = makeTransactionFromLogicSig;
