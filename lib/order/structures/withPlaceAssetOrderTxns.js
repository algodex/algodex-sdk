const makePaymentTxn = require('../txns/makePaymentTxn');
const makeTransactionFromLogicSig = require('../txns/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('../txns/makeAssetTransferTxn');
const logger = require('pino')({
  prettyPrint: {
    levelFirst: true,
  },
});

/**
 * ## ✉ withPlaceAssetOrderTxns
 *
 * Add the outer transactions for an Asset order. This method
 * attaches it's generated transactions to the orders contract
 * state.
 *
 * @param {Order} order Algodex Order
 * @return {Order} The Order with Transaction
 * @memberOf module:order/structures
 */


async function withPlaceAssetOrderTxns(order) {
  const {
    contract,
    params,
    version,
    address: makerAccount,
    appId,
    isExistingEscrow = false,
    skipASAOptIn = false,
  } = order;

  console.log('checking assetId type');
  assetId = parseInt(assetId + '');

  // const makerAddr = makerAccount.addr;
  // const min = 0;
  // const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  // const n = numAndDenom.n;
  // const d = numAndDenom.d;
  if (typeof order?.contract === 'undefined') {
    throw new TypeError('Must have valid contract state!!');
  }
  const {entry: generatedOrderEntry, lsig, optedIn} = contract;
  const outerTxns = [];


  // I think the assetOptIn check can be done higher up as well.
  // check if the lsig has already opted in
  const accountInfo = await algodex.getAccountInfo(lsig.address());
  let alreadyOptedIn = false;
  if (accountInfo != null && accountInfo['apps-local-state'] != null &&
          accountInfo['apps-local-state'].length > 0 &&
          accountInfo['apps-local-state'][0].id === appId) {
    alreadyOptedIn = true;
  }
  console.log('alreadyOptedIn: ' + alreadyOptedIn);
  console.log('acct info:' + JSON.stringify(accountInfo));

  // const params = await algodClient.getTransactionParams().do();
  console.log('sending trans to: ' + lsig.address());


  const assetSendTrans = await makeAssetTransferTxn(order, false);

  const payTxn = await makePaymentTxn(order, false);

  // TODO: Fixme!
  // myAlgoWalletUtil.setTransactionFee(payTxn);

  console.log('typeof: ' + typeof payTxn.txId);
  console.log('the val: ' + payTxn.txId);

  // console.log("confirmed!!");
  // create unsigned transaction

  console.log('here3 calling app from logic sig to open order');
  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('open'));

  appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
  appArgs.push(new Uint8Array([constants.ESCROW_CONTRACT_VERSION]));

  // add owners address as arg
  // ownersAddr = "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI";
  // ownersBitAddr = (algosdk.decodeAddress(ownersAddr)).publicKey;
  console.log(appArgs.length);

  const logSigTrans = await makeTransactionFromLogicSig(
      lsig,
      appId,
      appArgs,
      'appOptIn',
      params,
  );


  // **** In regards to the below comments and declerations:
  // Since the only unique feature of the below transaction is sender and recipient being the same, we can use:
  // makeASsetTranserTxn() with very little tweaking since revocationTarget defaults to undefined in makeAssetTransferTxn.

  // create optin transaction
  // sender and receiver are both the same
  const sender = lsig.address();
  const recipient = sender;
  // We set revocationTarget to undefined as
  // This is not a clawback operation
  const revocationTarget = undefined;
  // CloseReaminerTo is set to undefined as
  // we are not closing out an asset
  const closeRemainderTo = undefined;
  // We are sending 0 assets
  const amount = 0;
  //    const {from, to, amount, asset: {id: assetId}, params} = order;
  // signing and sending "txn" allows sender to begin accepting asset specified by creator and index

  const logSigAssetObject = {from: sender, to: recipient, amount: amount, ...order};
  const logSigAssetOptInTrans = makeAssetTransferTxn(logSigAssetObject, false);

  outerTxns.push({
    unsignedTxn: payTxn,
    senderAcct: makerAccount,
  });
  outerTxns.push({
    unsignedTxn: logSigTrans,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: logSigAssetOptInTrans, // confused as to why we aren't using already opted in to conditionally push this transaction.
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: assetSendTrans,
    senderAcct: makerAccount,
  });

  return outerTxns;
}

module.exports = withPlaceAssetOrderTxns;
