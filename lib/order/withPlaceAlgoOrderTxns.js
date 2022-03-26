const makePaymentTxn = require('./txns/makePaymentTxn');
const makeTransactionFromLogicSig = require('./txns/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('./txns/makeAssetTransferTxn');
/**
 * ## ✉ Place Algo Order
 *
 * @param {Order} order Algodex Order
 * @return {Order}
 * @memberOf Transactions
 */
function withPlaceAlgoOrderTxns(order) {
  const {
    contract,
    params,
    version,
    address: makerAccount,
    appId,
    isExistingEscrow = false,
    skipASAOptIn = false,
  } = order;

  const {entry: generatedOrderEntry, lsig} = contract;

  console.log('sending trans to: ' + lsig.address());

  const txn = makePaymentTxn(order, false);
  const outerTxns = [];

  outerTxns.push({
    unsignedTxn: txn,
    senderAcct: makerAccount,
  });

  console.log('here3 calling app from logic sig to open order');
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('open'));
  appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
  appArgs.push(new Uint8Array([version]));

  // appArgs.push(algosdk.decodeAddress(makerAddr).publicKey);

  // console.log("owners bit addr: " + ownersBitAddr);
  console.log('herezzz_888');
  console.log(appArgs.length);
  let logSigTrans = null;

  if (!isExistingEscrow) {
    logSigTrans = makeTransactionFromLogicSig(
        lsig,
        appId,
        appArgs,
        'appOptIn',
        params,
    );
    outerTxns.push({
      unsignedTxn: logSigTrans,
      lsig: lsig,
    });
  }

  console.log('skipASAOptIn: ' + skipASAOptIn);

  if (!skipASAOptIn) {
    // asset opt-in transfer
    const assetOptInTxn = makeAssetTransferTxn(order, false);

    outerTxns.push({
      unsignedTxn: assetOptInTxn,
      senderAcct: makerAccount,
    });
  }
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: outerTxns,
    },
  };
}

module.exports = withPlaceAlgoOrderTxns;
