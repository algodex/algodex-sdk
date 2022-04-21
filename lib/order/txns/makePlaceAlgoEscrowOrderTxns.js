const makePaymentTxn = require('../../teal/txns/makePaymentTxn');
const makeAssetTransferTxn = require('../../teal/txns/makeAssetTransferTxn');
const createTransactionFromLogicSig = require('../../teal/createTransactionFromLogicSig');
const toNumeratorDenominator = require('../toNumeratorDenominator');
const compileLogicSig = require('../../teal/compile/compileLogicSig');
const compileDelegateTemplate = require('../compile/compileDelegateTemplate');

/**
 *
 * @param {algosdk.Algodv2} client
 * @param {algosdk.Account} makerAccount
 * @param {number} algoOrderSize
 * @param {number} price
 * @param {number} assetId
 * @param {number} appId
 * @param {boolean} isExistingEscrow
 * @param {boolean} skipASAOptIn
 * @return {Promise<*>}
 */
async function makePlaceAlgoEscrowOrderTxns(
    client,
    makerAccount,
    algoOrderSize,
    price,
    assetId,
    appId,
    isExistingEscrow = false,
    skipASAOptIn = false,
) {
  const makerAddr = makerAccount.addr;
  const min = 0;
  const numAndDenom = toNumeratorDenominator(price);
  const n = numAndDenom.N;
  const d = numAndDenom.D;
  console.log('getPlaceAlgoEscrowOrderTxns makerWalletAddr, n, d, min, assetId',
      makerAddr, n, d, min, assetId);
  const program = algodex.buildDelegateTemplateFromArgs(min, assetId, n, d, makerAddr, false, constants.ESCROW_CONTRACT_VERSION);

  const lsig = await algodex.getLsigFromProgramSource(algosdk, client, program, constants.DEBUG_SMART_CONTRACT_SOURCE);
  const generatedOrderEntry = algodex.generateOrder(makerAddr, n, d, min, assetId);
  console.log('sending trans to: ' + lsig.address());

  const txn = await makePaymentTxn(client, makerAddr, lsig.address(), algoOrderSize, false);
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
    logSigTrans = await createTransactionFromLogicSig(client, lsig, appId, appArgs, 'appOptIn');
    outerTxns.push({
      unsignedTxn: logSigTrans,
      lsig: lsig,
    });
  }

  console.log('skipASAOptIn: ' + skipASAOptIn);

  if (!skipASAOptIn) {
    // asset opt-in transfer
    const assetOptInTxn = await makeAssetTransferTxn(client, makerAddr, makerAddr, 0, assetId, false);

    outerTxns.push({
      unsignedTxn: assetOptInTxn,
      senderAcct: makerAccount,
    });
  }
  return outerTxns;
}

module.exports = makePlaceAlgoEscrowOrderTxns;
