const makePaymentTxn = require('../txns/makePaymentTxn');
const makeTransactionFromLogicSig = require('../txns/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('../txns/makeAssetTransferTxn');
const {makeApplicationCloseOutTxn, makeApplicationNoOpTxn} = require('algosdk');


async function withExecuteAlgoOrderTxns(order) {
  const {
    address: executorAccount,
    escrow, // used to be maker account
    escrowCreator: makerAccount,
    asaAmountSending,
    algoAmountReceiving,
    price,
    asset: {
      id: assetId,
    },
    appId,
    shouldClose,
    entry: orderBookEntry,
    program,
    lsig,
    params} = order;

  if (algoAmountReceiving === 0) {
    return null;
  }

  const orderCreatorAddr = makerAccount; // right now makerAccount is being passed in as Lsig
  // const min = 0;
  // const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  // const n = numAndDenom.n;
  // const d = numAndDenom.d;
  const takerAddr = executorAccount;

  // let appCallType = null;
  // const orderBookEntry = algodex.generateOrder(orderCreatorAddr, n, d, min, assetId, false);
  const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

  // const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, false, constants.ESCROW_CONTRACT_VERSION);
  // const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
  // const params = await algodClient.getTransactionParams().do();

  const appAccts = [];
  appAccts.push(orderCreatorAddr);
  appAccts.push(takerAddr);

  let closeRemainderTo;

  if (shouldClose) {
    closeRemainderTo = makerAccount;
  }

  if (typeof closeRemainderTo === 'undefined') {
    appCallType = 'execute';
  } else {
    appCallType = 'execute_with_closeout';
  }
  console.log('arg1: ' + appCallType);
  console.log('arg2: ' + orderBookEntry);
  console.log('arg3: ' + orderCreatorAddr);

  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode(appCallType));
  appArgs.push(enc.encode(orderBookEntry));
  console.log(appArgs.length);

  let transaction1 = null;

  if (typeof closeRemainderTo === 'undefined') {
    transaction1 = makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts);
  } else {
    transaction1 = makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts);
  }


  // Make payment tx signed with lsig
  const transaction2 = makePaymentTxn({
    from: lsig.address(),
    to: takerAddr,
    amount: algoAmountReceiving,
    contract: {params: params},
    ...order},
        shouldClose ?
        true :
        false,
  );
  // const transaction2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), takerAddr, algoAmountReceiving, closeRemainderTo, undefined, params);
  // Make asset xfer
  const transaction3 = await makeAssetTransferTxn({
    from: takerAddr,
    to: orderCreatorAddr,
    amount: asaAmountSending,
    ...order,
  }, false);
  // const transaction3 = await AssetTransferTxn(algodClient, takerAddr, orderCreatorAddr, asaAmountSending, assetId, false);

  let transaction4 = null;

  if (closeRemainderTo === undefined) {
    // create refund transaction for fees
    transaction4 = await makePaymentTxn({
      from: takerAddr,
      to: lsig.address(),
      amount: refundFees,
      contract: {params: params}, // toDo: standardize a place for params, no reason for makeAssetTransfer and makePaymentTxn to have different structures for it
    }, shouldClose);
    // transaction4 = await PaymentTxn(algodClient, takerAddr, lsig.address(), refundFees, false);
  }

  const retTxns = [];

  retTxns.push({
    'unsignedTxn': transaction1,
    'lsig': lsig,
  });
  retTxns.push({
    'unsignedTxn': transaction2,
    'lsig': lsig,
  });
  retTxns.push({
    'unsignedTxn': transaction3,
    'senderAcct': executorAccount,
  });

  if (transaction4 != null) {
    retTxns.push({
      'unsignedTxn': transaction4,
      'senderAcct': executorAccount,
    });
  }

  return retTxns;
}

module.exports = withExecuteAlgoOrderTxns;
