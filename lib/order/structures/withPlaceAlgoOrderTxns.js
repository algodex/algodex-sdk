const makePaymentTxn = require('../txns/makePaymentTxn');
const makeTransactionFromLogicSig = require('../txns/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('../txns/makeAssetTransferTxn');
const logger = require('pino')({
  prettyPrint: {
    levelFirst: true,
  },
});
/**
 * ## ✉ withPlaceAlgoOrderTxns
 *
 * Add the outer transactions for an Algo order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 * @memberOf module:order/structures
 */
function withPlaceAlgoOrderTxns(order) {
  const {
    contract,
    params,
    version,
    address: makerAccount,
    appId,
    isExistingEscrow = contract.escrow? true: false,
    skipASAOptIn = false,
  } = order;

  if (typeof order?.contract === 'undefined') {
    throw new TypeError('Must have valid contract state!!');
  }
  const {entry: generatedOrderEntry, lsig} = contract;

  logger.debug('sending trans to: ' + lsig.address());

  const paymentObject = {
    from: makerAccount,
    to: lsig.address(),
    amount: contract.total, // amount represents the amount of Asa desired.
    contract: {params: order.params},

  };
  // order.from = makerAccount
  // order.to = lsig.address
  // order.amount = order.contract.amount
  // order.contract.params = order.params

  const paymentTxn = makePaymentTxn(paymentObject, false);
  const txns = [];

  txns.push({
    unsignedTxn: paymentTxn,
    senderAcct: makerAccount,
  });

  logger.debug('here3 calling app from logic sig to open order');
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('open'));
  appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
  appArgs.push(new Uint8Array([version]));

  // appArgs.push(algosdk.decodeAddress(makerAddr).publicKey);

  // logger.debug("owners bit addr: " + ownersBitAddr);
  logger.debug('herezzz_888');
  logger.debug(appArgs.length);
  let logSigTrans = null;

  if (!isExistingEscrow) {
    logSigTrans = makeTransactionFromLogicSig(
        lsig,
        appId,
        appArgs,
        'appOptIn',
        params,
    );
    txns.push({
      unsignedTxn: logSigTrans,
      lsig: lsig,
    });
  }

  logger.debug('skipASAOptIn: ' + skipASAOptIn);

  if (!skipASAOptIn) {
    // asset opt-in transfer
    const assetOptInTxn = makeAssetTransferTxn(order, false);

    txns.push({
      unsignedTxn: assetOptInTxn,
      senderAcct: makerAccount,
    });
  }
  return {
    ...order,
    contract: {
      ...order?.contract,
      txns,
    },
  };
}

module.exports = withPlaceAlgoOrderTxns;
