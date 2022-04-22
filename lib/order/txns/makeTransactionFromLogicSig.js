/** @module order/txns */
const makeTransactionFromLogicSig = require('../../teal/txns/makeTransactionFromLogicSig');

/**
 * @TODO import this directly from the teal library
 * @deprecated
 * @type {function(AlgodClient, ("appNoOp"|"appOptIn"), LogicSigAccount, SuggestedParams, number, Array<Uint8Array>=): Promise<Transaction>}
 */
module.exports = makeTransactionFromLogicSig;
