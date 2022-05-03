const logger = require('../../logger');
const makePaymentTxn = require('../txns/makePaymentTxn');
const makeTransactionFromLogicSig = require('../txns/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('../txns/makeAssetTransferTxn');
const {makeApplicationCloseOutTxn, makeApplicationNoOpTxn} = require('algosdk');
const makeExecuteAlgoTxns = require('../txns/makeExecuteAlgoTxns');
const {txns} = require('../../teal');


async function structureCutAlgoTakerTxns(order) {
  const {
    cutTakerOrder: {
      escrowCreator,
      asaAmountSending,
      algoAmountReceiving,
      lsig},
  } = order;

  return await makeExecuteAlgoTxns({
    ...order,
    contract: {
      ...order.contract,
      amountSending: asaAmountSending,
      amountReceiving: algoAmountReceiving,
      lsig: lsig,
      creator: escrowCreator,
    },

  });
}

module.exports = structureCutAlgoTakerTxns;
