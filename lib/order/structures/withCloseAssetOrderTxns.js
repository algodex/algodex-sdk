const makePaymentTxn = require('../txns/makePaymentTxn');
const makeTransactionFromLogicSig = require('../txns/makeTransactionFromLogicSig');
const makeAssetTransferTxn = require('../txns/makeAssetTransferTxn');
const {makeApplicationClearStateTxn} = require('algosdk');

const logger = require('pino')({
  prettyPrint: {
    levelFirst: true,
  },
});


async function withCloseAssetOrderTxns(order) {
  // const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  // const n = numAndDenom.n;
  // const d = numAndDenom.d;
  // const creatorAddr = creator.addr;

  // const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, creatorAddr, true, constants.ESCROW_CONTRACT_VERSION);
  // const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
  // const escrowAccountAddr = lsig.address();

  // following structure in: https://github.com/algodex/algodex-sdk/issues/122
  const {
    lsig,
    program, // another name for buildDelegateTemplateFromArgs()
    params,
    entry: orderBookEntry,
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
  // console.log('closing order from order book entry!');
  // console.log('escrowAccountAddr, creatorAddr, orderBookEntry',
  //     escrowAccountAddr, creatorAddr, orderBookEntry);

  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('close'));
  appArgs.push(enc.encode(orderBookEntry));
  // appArgs.push(enc.encode(creatorAddr));
  console.log('args length: ' + appArgs.length);


  // create unsigned transaction
  const txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, appId, appArgs); // Bring up with Michael: algoSDK needs to be passed in
  // solution: require specific SDK method as shown in the above requires and build txn like the below
  // const txn = makeApplicationClearStateTxn(lsig.address(), params, appId, appArgs)

  const txId = txn.txID().toString();
  // Submit the transaction

  // create optin transaction
  // sender and receiver are both the same
  const sender = lsig.address();
  const recipient = makerAccount;
  // We set revocationTarget to undefined as
  // This is not a clawback operation
  const revocationTarget = undefined;
  // CloseReaminerTo is set to undefined as
  // we are not closing out an asset
  const closeRemainderTo = makerAccount;
  // We are sending 0 assets
  const amount = 0;

  const assetTransferObject = {
    from: sender,
    to: recipient,
    amount: amount,
    ...order,
  };

  // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
  const txn2 = makeAssetTransferTxn(assetTransferObject);

  // Make payment tx signed with lsig
  const txn3 = makePaymentTxn(assetTransferObject, true);

  // proof of ownership transaction
  const txn4 = makePaymentTxn({
    from: makerAccount,
    to: makerAccount,
    ...assetTransferObject,
  }, false);

  outerTxns.push({
    unsignedTxn: txn,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: txn2,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: txn3,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: txn4,
    senderAcct: makerAccount, // in alex's its creator which = {addr: "creatorAddress"}
  });

  return outerTxns;
}

module.exports = withCloseAssetOrderTxns;
