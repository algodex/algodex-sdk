const makePaymentTxn = require('../makePaymentTxn');

const {makeApplicationClearStateTxn, makePaymentTxnWithSuggestedParams} = require('algosdk');

const logger = require('../../../logger');

async function withCloseAlgoOrderTxns(order) {
  const {
    contract: {
      lsig,
      program, // another name for buildDelegateTemplateFromArgs()
      params,
      entry: orderBookEntry,
    },
    version,
    address: makerAccount,
    appId,
    isExistingEscrow = false,
    skipASAOptIn = false,
    asset,
  } = order;


  const outerTxns = [];
  // "2500-625-0-15322902"
  // const orderBookEntry = n + '-' + d + '-0-' + assetId;
  console.log('closing order from order book entry!');
  console.log('escrowAccountAddr, creatorAddr, orderBookEntry',
      escrowAccountAddr, creatorAddr, orderBookEntry);


  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('close'));
  appArgs.push(enc.encode(orderBookEntry));
  // appArgs.push(enc.encode(creatorAddr));
  console.log('args length: ' + appArgs.length);


  // create unsigned transaction
  const txn = makeApplicationClearStateTxn(lsig.address(), params, appId, appArgs);
  outerTxns.push({
    unsignedTxn: txn,
    lsig: lsig,
  });
  // Submit the transaction

  // Make payment tx signed with lsig
  const txn2 = makePaymentTxn({
    from: lsig.adress(),
    to: makerAccount,
    amount: 0,
    ...order,
  }, false);

  outerTxns.push({
    unsignedTxn: txn2,
    lsig: lsig,
  });

  const txn3 = makePaymentTxn({
    from: makerAccount,
    to: makerAccount,
    amount: 0,
    ...order,
  }, false);


  outerTxns.push({
    unsignedTxn: txn3,
    senderAcct: makerAccount,
  });

  return outerTxns;
}

module.exports = withCloseAlgoOrderTxns;
