const makePaymentTxn = require('../deleteme/makePaymentTxn');
const makeTransactionFromLogicSig = require('../deleteme/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('../deleteme/makeAssetTransferTxn');
const {makeApplicationCloseOutTxn, makeApplicationNoOpTxn} = require('algosdk');
const logger = require('../../logger');

async function withExecuteAssetOrderTxns(order) {
  const {
    address: executorAccount,
    escrow: escrowAccount,
    escrowCreator: escrowCreatorAccount,
    algoAmountSending,
    asaAmountReceiving,
    price,
    asset: {
      id: assetId,
    },
    appId,
    shouldClose,
    entry: orderBookEntry,
    params,
    lsig,
    takerIsOptedIn,
    orderBookEscrowEntry,
  } = order;

  if (algoAmountSending === 0) {
    return null;
  }

  // ***** asaAmountReceiving is wrong use the return value of the function called in the above scope
  // const asaAmountReceiving = algoAmountSending * price; // I think this is right but will have to double check ***** I do not think this is right
  logger.debug('here664 ', executorAccount, escrowAccount, algoAmountSending, asaAmountReceiving, price, assetId, appId, shouldClose);
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
  appAccts.push(escrowCreatorAccount);
  appAccts.push(executorAccount);


  let transaction1 = null;
  let closeRemainderTo = undefined;

  if (shouldClose) {
    closeRemainderTo = escrowCreatorAccount;
    appCallType = 'execute_with_closeout';
  } else {
    appCallType = 'execute';
  }

  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode(appCallType));
  appArgs.push(enc.encode(orderBookEntry));
  if (orderBookEscrowEntry.txNum !== null ) {
    appArgs.push(enc.encode(orderBookEscrowEntry.txnNum));
  }

  if (typeof closeRemainderTo === 'undefined') {
    transaction1 = makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
  } else {
    transaction1 = makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
  }

  logger.debug('app call type is: ' + appCallType);

  const transaction2 = await makePaymentTxn({
    from: takerAddr,
    to: escrowCreatorAccount,
    amount: algoAmountSending,
    contract: {params: params},
    ...order},
  false);

  // const transaction2 = await makePaymentTxn(algodClient, takerAddr, orderCreatorAddr, algoAmountSending, false);

  // const accountInfo = await algodex.getAccountInfo(takerAddr);
  // let takerAlreadyOptedIntoASA = false;
  // if (accountInfo != null && accountInfo['assets'] != null &&
  //       accountInfo['assets'].length > 0) {
  //   for (let i = 0; i < accountInfo['assets'].length; i++) {
  //     if (accountInfo['assets'][i]['asset-id'] === assetId) {
  //       takerAlreadyOptedIntoASA = true;
  //       break;
  //     }
  //   }
  // }

  // asset opt-in transfer
  let transaction2b = null;

  if (!takerIsOptedIn) {
    transaction2b = await makeAssetTransferTxn({from: takerAddr, to: takerAddr, amount: 0, contract: {params: params}, ...order}, false);
    // transaction2b = await makeAssetTransferTxn(algodClient, takerAddr, takerAddr, 0, assetId, false);
  }

  // Make asset xfer

  // Asset transfer from escrow account to order executor
  const transaction3 = makeAssetTransferTxn(
      {
        from: lsig.address(),
        to: takerAddr,
        amount: asaAmountReceiving,
        contract: {params: params},
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
    logger.debug('making transaction4 due to closeRemainderTo');
    transaction4 = await makePaymentTxn({
      from: lsig.address(),
      to: escrowCreatorAccount,
      amount: 0,
      contract: {params: params},
      ...order},
    true);
    // transaction4 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), orderCreatorAddr, 0, orderCreatorAddr,
    //     undefined, params);
  } else {
    // Make fee refund transaction
    transaction4 = await makePaymentTxn({
      from: takerAddr,
      // to: lsig.address(), //Wrong! IDK where these structures came from but they do not match v1
      to: escrowAccount,
      amount: refundFees,
      contract: {params: params},
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
