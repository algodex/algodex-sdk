const makePaymentTxn = require('../txns/makePaymentTxn');
const makeTransactionFromLogicSig = require('../txns/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('../txns/makeAssetTransferTxn');
const {makeApplicationCloseOutTxn, makeApplicationNoOpTxn} = require('algosdk');


async function withExecuteAssetOrderTxns(order) {
  const {
    address: executorAccount,
    escrow: makerAccount,
    amount: algoAmountSending,
    price,
    asset: {
      id: assetId,
    },
    appId,
    shouldClose,
    entry: orderBookEntry,
    program,
    lsig} = order;
  const asaAmountReceiving = algoAmountSending * price; // I think this is right but will have to double check
  console.log('here664 ', executorAccount, makerAccount, algoAmountSending, asaAmountReceiving, price, assetId, appId, shouldClose);
  // const orderCreatorAddr = makerAccount.addr;
  // const min = 0;
  // const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  // const n = numAndDenom.n;
  // const d = numAndDenom.d;
  // const takerAddr = executorAccount.addr;
  const takerAddr = executorAccount;

  const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

  let appCallType = null;
  // const orderBookEntry = algodex.generateOrder(orderCreatorAddr, n, d, min, assetId, false);

  // const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, true, constants.ESCROW_CONTRACT_VERSION);
  // const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
  // const params = await algodClient.getTransactionParams().do();

  const appAccts = [];
  appAccts.push(makerAccount);
  appAccts.push(takerAddr);


  let transaction1 = null;
  let closeRemainderTo = undefined;

  if (shouldClose) {
    closeRemainderTo = makerAccount;
    appCallType = 'execute_with_closeout';
  } else {
    appCallType = 'execute';
  }

  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode(appCallType));
  appArgs.push(enc.encode(orderBookEntry));

  if (typeof closeRemainderTo === 'undefined') {
    transaction1 = makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
  } else {
    transaction1 = makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
  }

  console.log('app call type is: ' + appCallType);

  const transaction2 = await makePaymentTxn({
    from: takerAddr,
    to: executorAccount,
    amount: algoAmountSending,
    ...order},
  false);

  // const transaction2 = await makePaymentTxn(algodClient, takerAddr, orderCreatorAddr, algoAmountSending, false);

  const accountInfo = await algodex.getAccountInfo(takerAddr);
  let takerAlreadyOptedIntoASA = false;
  if (accountInfo != null && accountInfo['assets'] != null &&
        accountInfo['assets'].length > 0) {
    for (let i = 0; i < accountInfo['assets'].length; i++) {
      if (accountInfo['assets'][i]['asset-id'] === assetId) {
        takerAlreadyOptedIntoASA = true;
        break;
      }
    }
  }

  // asset opt-in transfer
  let transaction2b = null;

  if (!takerAlreadyOptedIntoASA) {
    transaction2b = await makeAssetTransferTxn({from: takerAddr, to: takerAddr, amount: 0, ...order}, false);
    // transaction2b = await makeAssetTransferTxn(algodClient, takerAddr, takerAddr, 0, assetId, false);
  }

  // Make asset xfer

  // Asset transfer from escrow account to order executor
  const transaction3 = makeAssetTransferTxn(
      {
        from: lsig.address(),
        to: takerAddr,
        asaAmountReceiving,
        ...order,
      },
        closeRemainderTo ?
        true :
        false);

  // const transaction3 = algosdk.makeAssetTransferTxnWithSuggestedParams(lsig.address(), takerAddr, closeRemainderTo, undefined,
  //     asaAmountReceiving, undefined, assetId, params);

  let transaction4 = null;
  if (typeof closeRemainderTo !== 'undefined') {
    // Make payment tx signed with lsig back to owner creator
    console.log('making transaction4 due to closeRemainderTo');
    transaction4 = await makePaymentTxn({
      from: takerAddr,
      to: executorAccount,
      amount: 0,
      ...order},
    true);
    // transaction4 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), orderCreatorAddr, 0, orderCreatorAddr,
    //     undefined, params);
  } else {
    // Make fee refund transaction
    transaction4 = await await makePaymentTxn({
      from: takerAddr,
      to: lsig.address(),
      amount: refundFees,
      ...order},
    false);
    // transaction4 = await PaymentTxn(algodClient, takerAddr, lsig.address(), refundFees, false);
  }

  // TODO: Fixme
  // if (transaction2b != null) {
  //   myAlgoWalletUtil.setTransactionFee(transaction2b);
  // }

  const retTxns = [];

  retTxns.push({
    'unsignedTxn': transaction1,
    'lsig': lsig,
  });
  retTxns.push({
    'unsignedTxn': transaction2, // FIXME - change to sdk
    'senderAcct': executorAccount,
  });

  if (transaction2b != null) {
    retTxns.push({
      'unsignedTxn': transaction2b, // FIXME - change to sdk
      'senderAcct': executorAccount,
    });
  }
  retTxns.push({
    'unsignedTxn': transaction3,
    'lsig': lsig,
  });
  if (typeof closeRemainderTo !== 'undefined') {
    // close out algo balance to owner
    retTxns.push({
      'unsignedTxn': transaction4,
      'lsig': lsig,
    });
  } else {
    // fee refund
    retTxns.push({
      'unsignedTxn': transaction4,
      'senderAcct': executorAccount,
    });
  }

  return retTxns;
}

module.exports = withExecuteAssetOrderTxns;
