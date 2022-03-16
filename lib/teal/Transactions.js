// ///////////////////////////
// Alexander Trefonas      //
// 7/12/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
// ///////////////////////////

/**
 * @module
 */

/**
 *@todo Split file into ./teal/transactions/<TYPE>.js and ./teal/customUtilityFunction.js
 */
const algosdk = require('algosdk');

const algoOrderBook = require('./dex_teal.js');
const asaOrderBook = require('./asa_dex_teal.js');


const myAlgoWalletUtil = require('../functions/MyAlgoWalletUtil.js');
// todo: change to destructured
const dexInternal = require('../functions/base.js');
const algodex = require('../AlgodexApi.js');
const constants = require('../constants.js');

// API Deprecation Utility
const deprecate = require('../functions/deprecate');
const depOpts = {
  file: './lib/generate_transaction_type.js',
  context: module.exports,
};
/**
 * @typedef {import("algosdk").Transaction} Transaction
 * @typedef {import("algosdk").Account} Account
 * @typedef {import("algosdk").Algodv2} Algodv2
 */

// ------------------ Teal Utility Methods ------------------------------------
/**
 * Compile Program
 *
 * helper function to compile program source
 *
 * @todo This is private to ./teal/ and should live in ./teal/utils.js
 * @param {algosdk.Algodv2} client Algorand SDK Client
 * @param {*} programSource Program source
 * @return {Promise<Uint8Array>}
 */
async function compileProgram(client, programSource) {
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(programSource);
  const compileResponse = await client.compile(programBytes).do();
  const compiledBytes = new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
  return compiledBytes;
}
/**
 * Get Lsig helper
 *
 * This may not be in use at all
 *
 * @todo Implement this function, it is not in use in the SDK
 * @todo This is private to ./teal/ and should live in ./teal/utils.js
 *
 * @param algodClient
 * @param {Account} creator Creator Account
 * @param {number|string} price Order Price
 * @param {string | number} assetId Algorand ASA Index
 * @param isAsaEscrow
 * @return {Promise<*>}
 */
async function getLsig(algodClient, creator, price, assetId, isAsaEscrow) {
  const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  const n = numAndDenom.n;
  const d = numAndDenom.d;
  const creatorAddr = creator.addr;

  const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, creatorAddr, isAsaEscrow, constants.ESCROW_CONTRACT_VERSION);
  return await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
}
// ----------------------------- Pureish Transaction Functions --------------------

/**
 * Payment Transaction
 *
 * Maps a Payment to makePaymentTxnWithSuggestedParams. Used as a part
 * of Transactions
 *
 * @todo Move to ./teal/Transactions/PaymentTxn
 * @todo make Constructor
 * @param {Algodv2} client Algorand SDK Client
 * @param {string | Account} fromAcct The account address or Account instance
 * @param {string | Account} toAcct The account address or Account instance
 * @param {number} amount Payment amount
 * @param {boolean} shouldClose Flag to close
 * @return {Promise<Transaction>}
 */
async function PaymentTxn(client, fromAcct, toAcct, amount, shouldClose) {
  if (typeof (fromAcct) !== 'string') {
    fromAcct = fromAcct.addr;
  }
  if (typeof (toAcct) !== 'string') {
    toAcct = toAcct.addr;
  }
  const params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;
  const enc = new TextEncoder();
  const note = enc.encode('Hello World');
  let closeAddr = undefined;
  if (shouldClose === true) {
    closeAddr = toAcct;
  }
  console.log({fromAcct, toAcct, amount, closeAddr, note, params});
  return algosdk.makePaymentTxnWithSuggestedParams(fromAcct, toAcct, amount, closeAddr, note, params);
}

/**
 * Asset Transfer Transaction
 *
 * @todo Move to ./teal/transactions/ApplicationTransferTxn
 * @todo Convert to Constructor
 * @param {Algodv2} client Algorand SDK Client
 * @param {string | Account} fromAcct The account address or Account instance
 * @param {string | Account} toAcct The account address or Account instance
 * @param {string | number} assetId Algorand ASA Index
 * @param {number} amount Payment amount
 * @param {boolean} shouldClose Flag to close
 * @return {Promise<Transaction>}
 */
async function AssetTransferTxn(client, fromAcct, toAcct, amount, assetId, shouldClose) {
  if (typeof (fromAcct) !== 'string') {
    fromAcct = fromAcct.addr;
  }
  if (typeof (toAcct) !== 'string') {
    toAcct = toAcct.addr;
  }
  const params = await client.getTransactionParams().do();
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  let closeAddr = undefined;
  if (shouldClose === true) {
    closeAddr = toAcct;
  }

  return algosdk.makeAssetTransferTxnWithSuggestedParams(fromAcct, toAcct, closeAddr, undefined,
      amount, undefined, assetId, params);
}

/**
 * Application Create Transaction
 *
 * @todo Move to ./teal/transactions/ApplicationCreateTxn
 * @todo Convert to Constructor
 * @param {Algodv2} client Algorand SDK Client
 * @param {Account} creatorAccount Creator Account
 * @param {boolean} isAlgoEscrowApp Flag for is Algo Escrow
 * @param {boolean} useBlankSource Flag to use Blank Source
 * @return {Promise<Transaction>}
 */
async function ApplicationCreateTxn(client, creatorAccount, isAlgoEscrowApp = true, useBlankSource = false) {
  // define sender as creator
  let approvalProgramSource = null;

  if (useBlankSource) {
    approvalProgramSource = `#pragma version 4
                                        int 1
                                        return`;
  } else if (isAlgoEscrowApp) {
    approvalProgramSource = algoOrderBook.getAlgoOrderBookApprovalProgram();
  } else {
    approvalProgramSource = asaOrderBook.getASAOrderBookApprovalProgram();
  }
  const clearProgramSource = algoOrderBook.getClearProgram();

  // declare application state storage (immutable)
  const localInts = 2;
  const localBytes = 1;
  const globalInts = 0;
  const globalBytes = 1;

  const sender = creatorAccount.addr;

  // declare onComplete as NoOp
  const onComplete = algosdk.OnApplicationComplete.NoOpOC;

  // get node suggested parameters
  const params = await client.getTransactionParams().do();
  // create unsigned transaction

  const approvalProgram = await compileProgram(client, approvalProgramSource);
  const clearProgram = await compileProgram(client, clearProgramSource);

  return algosdk.makeApplicationCreateTxn(sender, params, onComplete,
      approvalProgram, clearProgram,
      localInts, localBytes, globalInts, globalBytes);
}

// ----------------------------- Custom Transaction Groups --------------------

/**
 * @todo Move to ./teal/transactions/CloseAlgoEscrowOrderTxns
 * @todo Convert to Constructor Order()
 * @todo Create 'closeOrder(order)' Abstraction
 * @param {Algodv2} algodClient Algorand SDK Client
 * @param {Account} creator Creator Account
 * @param {number|string} price Order Price
 * @param {string | number} assetId Algorand ASA Index
 * @param {string|number} appId Application Index
 * @return {Promise<*[]>}
 */
async function CloseAlgoOrder(algodClient, creator, price, assetId, appId) {
  const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  const n = numAndDenom.n;
  const d = numAndDenom.d;
  const creatorAddr = creator.addr;

  const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, creatorAddr, false, constants.ESCROW_CONTRACT_VERSION);
  const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
  const escrowAccountAddr = lsig.address();

  const outerTxns = [];
  // "2500-625-0-15322902"
  const orderBookEntry = n + '-' + d + '-0-' + assetId;
  console.log('closing order from order book entry!');
  console.log('escrowAccountAddr, creatorAddr, orderBookEntry',
      escrowAccountAddr, creatorAddr, orderBookEntry);


  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('close'));
  appArgs.push(enc.encode(orderBookEntry));
  // appArgs.push(enc.encode(creatorAddr));
  console.log('args length: ' + appArgs.length);

  // get node suggested parameters
  const params = await algodClient.getTransactionParams().do();

  // create unsigned transaction
  const txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, appId, appArgs);
  outerTxns.push({
    unsignedTxn: txn,
    lsig: lsig,
  });
  // Submit the transaction

  // Make payment tx signed with lsig
  const txn2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), creatorAddr, 0, creatorAddr, undefined, params);
  outerTxns.push({
    unsignedTxn: txn2,
    lsig: lsig,
  });

  const txn3 = algosdk.makePaymentTxnWithSuggestedParams(creatorAddr, creatorAddr, 0, undefined, undefined, params);

  outerTxns.push({
    unsignedTxn: txn3,
    senderAcct: creator,
  });

  return outerTxns;
}

/**
 * @todo Move to ./teal/transactions/CloseASAEscrowOrderTxns
 * @todo Convert to Constructor Order()
 * @todo Create 'closeOrder(order)' Abstraction
 * @param {Algodv2} algodClient Algorand SDK Client
 * @param {Account} creator Creator Account
 * @param {number|string} price Order Price
 * @param {string | number} assetId Algorand ASA Index
 * @param {string|number} appId Application Index
 * @return {Promise<*[]>}
 */
async function CloseAssetOrder(algodClient, creator, price, assetId, appId) {
  const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  const n = numAndDenom.n;
  const d = numAndDenom.d;
  const creatorAddr = creator.addr;

  const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, creatorAddr, true, constants.ESCROW_CONTRACT_VERSION);
  const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
  const escrowAccountAddr = lsig.address();

  const outerTxns = [];
  // "2500-625-0-15322902"
  const orderBookEntry = n + '-' + d + '-0-' + assetId;
  console.log('closing order from order book entry!');
  console.log('escrowAccountAddr, creatorAddr, orderBookEntry',
      escrowAccountAddr, creatorAddr, orderBookEntry);

  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode('close'));
  appArgs.push(enc.encode(orderBookEntry));
  // appArgs.push(enc.encode(creatorAddr));
  console.log('args length: ' + appArgs.length);

  // get node suggested parameters
  const params = await algodClient.getTransactionParams().do();

  // create unsigned transaction
  const txn = algosdk.makeApplicationClearStateTxn(lsig.address(), params, appId, appArgs);
  const txId = txn.txID().toString();
  // Submit the transaction

  // create optin transaction
  // sender and receiver are both the same
  const sender = lsig.address();
  const recipient = creatorAddr;
  // We set revocationTarget to undefined as
  // This is not a clawback operation
  const revocationTarget = undefined;
  // CloseReaminerTo is set to undefined as
  // we are not closing out an asset
  const closeRemainderTo = creatorAddr;
  // We are sending 0 assets
  const amount = 0;

  // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
  const txn2 = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo, revocationTarget,
      amount, undefined, assetId, params);

  // Make payment tx signed with lsig
  const txn3 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), creatorAddr, 0, creatorAddr,
      undefined, params);

  // proof of ownership transaction
  const txn4 = algosdk.makePaymentTxnWithSuggestedParams(creatorAddr, creatorAddr, 0, undefined, undefined, params);

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
    senderAcct: creator,
  });

  return outerTxns;
}

/**
 * @todo Move to ./teal/transactions/ExecuteAlgoEscrowOrderTxns
 * @todo Convert to Constructor
 * @todo Create 'executeOrder(order)' Abstraction
 * @param {Algodv2} algodClient Algorand SDK Client
 * @param {Account} executorAccount Executor Account
 * @param {Account} makerAccount Maker Account
 * @param algoAmountReceiving
 * @param asaAmountSending
 * @param {number|string} price Order Price
 * @param {string | number} assetId Algorand ASA Index
 * @param {string|number} appId Application Index
 * @param shouldClose
 * @return {Promise<*[]>}
 */
async function ExecuteAlgoOrder(algodClient, executorAccount, makerAccount, algoAmountReceiving, asaAmountSending,
    price, assetId, appId, shouldClose = false) {
  const orderCreatorAddr = makerAccount.addr;
  const min = 0;
  const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  const n = numAndDenom.n;
  const d = numAndDenom.d;
  const takerAddr = executorAccount.addr;

  let appCallType = null;
  const orderBookEntry = algodex.generateOrder(orderCreatorAddr, n, d, min, assetId, false);
  const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

  const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, false, constants.ESCROW_CONTRACT_VERSION);
  const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
  const params = await algodClient.getTransactionParams().do();

  const appAccts = [];
  appAccts.push(orderCreatorAddr);
  appAccts.push(takerAddr);

  let closeRemainderTo;

  if (shouldClose) {
    closeRemainderTo = makerAccount.addr;
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
    transaction1 = algosdk.makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts);
  } else {
    transaction1 = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts);
  }


  // Make payment tx signed with lsig
  const transaction2 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), takerAddr, algoAmountReceiving, closeRemainderTo, undefined, params);
  // Make asset xfer

  const transaction3 = await new AssetTransferTxn(algodClient, takerAddr, orderCreatorAddr, asaAmountSending, assetId, false);

  let transaction4 = null;

  if (closeRemainderTo === undefined) {
    // create refund transaction for fees
    transaction4 = await new PaymentTxn(algodClient, takerAddr, lsig.address(), refundFees, false);
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

/**
 * @todo Move to ./teal/transactions/ExecuteASAEscrowOrderTxns
 * @todo Create 'executeOrder(order)' Abstraction
 * @param {Algodv2} algodClient Algorand SDK Client
 * @param {Account} executorAccount Executor Account
 * @param {Account} makerAccount Maker Account
 * @param algoAmountSending
 * @param asaAmountReceiving
 * @param {number|string} price Order Price
 * @param {string | number} assetId Algorand ASA Index
 * @param {string|number} appId Application Index
 * @param shouldClose
 * @return {Promise<*[]>}
 */
async function ExecuteAssetOrder(algodClient, executorAccount, makerAccount, algoAmountSending, asaAmountReceiving, price, assetId, appId, shouldClose = false) {
  console.log('here664 ', executorAccount, makerAccount, algoAmountSending, asaAmountReceiving, price, assetId, appId, shouldClose);
  const orderCreatorAddr = makerAccount.addr;
  const min = 0;
  const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  const n = numAndDenom.n;
  const d = numAndDenom.d;
  const takerAddr = executorAccount.addr;

  const refundFees = 0.002 * 1000000; // fees refunded to escrow in case of partial execution

  let appCallType = null;
  const orderBookEntry = algodex.generateOrder(orderCreatorAddr, n, d, min, assetId, false);

  const escrowSource = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, true, constants.ESCROW_CONTRACT_VERSION);
  const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, escrowSource, constants.DEBUG_SMART_CONTRACT_SOURCE);
  const params = await algodClient.getTransactionParams().do();

  const appAccts = [];
  appAccts.push(orderCreatorAddr);
  appAccts.push(takerAddr);


  let transaction1 = null;
  let closeRemainderTo = undefined;

  if (shouldClose) {
    closeRemainderTo = makerAccount.addr;
    appCallType = 'execute_with_closeout';
  } else {
    appCallType = 'execute';
  }

  const appArgs = [];
  const enc = new TextEncoder();
  appArgs.push(enc.encode(appCallType));
  appArgs.push(enc.encode(orderBookEntry));

  if (typeof closeRemainderTo === 'undefined') {
    transaction1 = algosdk.makeApplicationNoOpTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
  } else {
    transaction1 = algosdk.makeApplicationCloseOutTxn(lsig.address(), params, appId, appArgs, appAccts, [0], [assetId]);
  }

  console.log('app call type is: ' + appCallType);

  const transaction2 = await new PaymentTxn(algodClient, takerAddr, orderCreatorAddr, algoAmountSending, false);

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
    transaction2b = await new AssetTransferTxn(algodClient, takerAddr, takerAddr, 0, assetId, false);
  }

  // Make asset xfer

  // Asset transfer from escrow account to order executor

  const transaction3 = algosdk.makeAssetTransferTxnWithSuggestedParams(lsig.address(), takerAddr, closeRemainderTo, undefined,
      asaAmountReceiving, undefined, assetId, params);

  let transaction4 = null;
  if (typeof closeRemainderTo !== 'undefined') {
    // Make payment tx signed with lsig back to owner creator
    console.log('making transaction4 due to closeRemainderTo');
    transaction4 = algosdk.makePaymentTxnWithSuggestedParams(lsig.address(), orderCreatorAddr, 0, orderCreatorAddr,
        undefined, params);
  } else {
    // Make fee refund transaction
    transaction4 = await new PaymentTxn(algodClient, takerAddr, lsig.address(), refundFees, false);
  }

  if (transaction2b != null) {
    myAlgoWalletUtil.setTransactionFee(transaction2b);
  }

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

/**
 * Place Algo Order Transactions
 *
 * Future Interface:
 *
 * this.program
 * this.lsig
 * this.account
 * this.order
 * this.fees
 * this.params
 * this.txns = [
 *    {
 *     type: 'AssetTransferTxn'
 *     unsignedTxn: assetOptInTxn,
 *     lsig: lsig
 *    },
 * ]
 * @todo Move to ./teal/transactions/PlaceAlgoEscrowOrderTxns
 * @todo Convert to Constructor
 * @param {Algodv2} algodClient Algorand SDK Client
 * @param {Account} makerAccount Maker Account
 * @param algoOrderSize
 * @param {number|string} price Order Price
 * @param {string | number} assetId Algorand ASA Index
 * @param {string|number} appId Application Index
 * @param {boolean} isExistingEscrow Flag for existing Escrow
 * @param skipASAOptIn
 * @return {Promise<*[]>}
 */
async function PlaceAlgoOrder(algodClient, makerAccount, algoOrderSize, price, assetId, appId, isExistingEscrow = false,
    skipASAOptIn = false) {
  const makerAddr = makerAccount.addr;
  const min = 0;
  const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  const n = numAndDenom.n;
  const d = numAndDenom.d;
  console.log('getPlaceAlgoEscrowOrderTxns makerWalletAddr, n, d, min, assetId',
      makerAddr, n, d, min, assetId);
  const program = algodex.buildDelegateTemplateFromArgs(min, assetId, n, d, makerAddr, false, constants.ESCROW_CONTRACT_VERSION);
  const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
  const generatedOrderEntry = algodex.generateOrder(makerAddr, n, d, min, assetId);
  console.log('sending trans to: ' + lsig.address());

  const txn = await new PaymentTxn(algodClient, makerAddr, lsig.address(), algoOrderSize, false);
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
  appArgs.push(new Uint8Array([constants.ESCROW_CONTRACT_VERSION]));

  // appArgs.push(algosdk.decodeAddress(makerAddr).publicKey);

  // console.log("owners bit addr: " + ownersBitAddr);
  console.log('herezzz_888');
  console.log(appArgs.length);
  let logSigTrans = null;

  if (!isExistingEscrow) {
    logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig, appId, appArgs, 'appOptIn');
    outerTxns.push({
      unsignedTxn: logSigTrans,
      lsig: lsig,
    });
  }

  console.log('skipASAOptIn: ' + skipASAOptIn);

  if (!skipASAOptIn) {
    // asset opt-in transfer
    const assetOptInTxn = await new AssetTransferTxn(algodClient, makerAddr, makerAddr, 0, assetId, false);

    outerTxns.push({
      unsignedTxn: assetOptInTxn,
      senderAcct: makerAccount,
    });
  }
  return outerTxns;
}

/**
 * Place Asset Order Transactions
 *
 * A group of transactions that represents the transfer of an Asset to an Escrow Account.
 *
 * Future Interface:
 *
 * this.program
 * this.lsig
 * this.account
 * this.order
 * this.fees
 * this.params
 * this.txns = [
 *    {
 *     type: 'AssetTransferTxn'
 *     unsignedTxn: logSigAssetOptInTrans,
 *     lsig: lsig
 *    },
 * ]
 *
 *
 * @todo Move to ./teal/transactions/PlaceASAEscrowOrderTxns
 * @todo Convert to Constructor
 * @param {Algodv2} algodClient Algorand SDK Client
 * @param {Account} makerAccount Maker Account
 * @param {number} asaOrderSize Size of Order
 * @param {number|string} price Order Price
 * @param {string | number} assetId Algorand ASA Index
 * @param {string|number} appId Application Index
 * @param {boolean} isExistingEscrow Flag for existing Escrow
 * @return {Promise<*>}
 */
async function PlaceAssetOrder(algodClient, makerAccount, asaOrderSize, price, assetId, appId, isExistingEscrow = false) {
  console.log('checking assetId type');
  assetId = parseInt(assetId + '');

  const makerAddr = makerAccount.addr;
  const min = 0;
  const numAndDenom = algodex.getNumeratorAndDenominatorFromPrice(price);
  const n = numAndDenom.n;
  const d = numAndDenom.d;

  const outerTxns = [];

  const program = algodex.buildDelegateTemplateFromArgs(min, assetId, n, d, makerAddr, true, constants.ESCROW_CONTRACT_VERSION);

  const lsig = await algodex.getLsigFromProgramSource(algosdk, algodClient, program);
  const generatedOrderEntry = algodex.generateOrder(makerAddr, n, d, min, assetId);
  console.log('address is: ' + lsig.address());

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

  const params = await algodClient.getTransactionParams().do();
  console.log('sending trans to: ' + lsig.address());


  const assetSendTrans = await new AssetTransferTxn(algodClient, makerAddr, lsig.address(), asaOrderSize, assetId,
      false);

  const payTxn = await new PaymentTxn(algodClient, makerAddr, lsig.address(), constants.MIN_ASA_ESCROW_BALANCE,
      false);

  myAlgoWalletUtil.setTransactionFee(payTxn);

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

  const logSigTrans = await dexInternal.createTransactionFromLogicSig(algodClient, lsig, appId,
      appArgs, 'appOptIn');

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

  // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
  const logSigAssetOptInTrans = algosdk.makeAssetTransferTxnWithSuggestedParams(sender, recipient, closeRemainderTo,
      revocationTarget,
      amount, undefined, assetId, params);

  outerTxns.push({
    unsignedTxn: payTxn,
    senderAcct: makerAccount,
  });
  outerTxns.push({
    unsignedTxn: logSigTrans,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: logSigAssetOptInTrans,
    lsig: lsig,
  });
  outerTxns.push({
    unsignedTxn: assetSendTrans,
    senderAcct: makerAccount,
  });

  return outerTxns;
}

// -------------------------- Deprecated Exports ---------------------------------------------------
module.exports = {
  /**
     * @deprecated
     */
  compileProgram: deprecate(compileProgram, {...depOpts, throws: true}),
  /**
     * @deprecated
     */
  getLsig: deprecate(getLsig, {...depOpts, throws: true}),
  /**
     * @deprecated
     */
  getAssetSendTxn: deprecate(AssetTransferTxn, depOpts),
  /**
     * @deprecated
     */
  getPayTxn: deprecate(PaymentTxn, depOpts),
  /**
     * @deprecated
     */
  getCreateAppTxn: deprecate(ApplicationCreateTxn, depOpts),

  /**
     * @deprecated
     */
  getCloseAlgoEscrowOrderTxns: deprecate(CloseAlgoOrder, depOpts),
  /**
     * @deprecated
     */
  getCloseASAEscrowOrderTxns: deprecate(CloseAssetOrder, depOpts),
  /**
     * @deprecated
     */
  getExecuteAlgoEscrowOrderTxns: deprecate(ExecuteAlgoOrder, depOpts),
  /**
     * @deprecated
     */
  getExecuteASAEscrowOrderTxns: deprecate(ExecuteAssetOrder, depOpts),
  /**
     * @deprecated
     */
  getPlaceAlgoEscrowOrderTxns: deprecate(PlaceAlgoOrder, depOpts),
  /**
     * @deprecated
     */
  getPlaceASAEscrowOrderTxns: deprecate(PlaceAssetOrder, depOpts),

};

