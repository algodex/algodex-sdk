const algosdk = require('algosdk');
const logger = require('../../logger');
const AlgodError = require('../../error/AlgodError');
const enc = require('../../utils/encoder');
const {
  makePaymentTxn,
  makeAssetOptInTxn,
  makeAssetTransferTxn,
} = require('../txns');
const teal = require('../../teal');

const isOptedIn = async (algodClient, account, assetId) => {
  try {
    const accountAssetInfo = await algodClient.accountAssetInformation(account, assetId).do();
    return true;
  } catch (e) {
    return false;
    // IDK what happened to the other method I wrote but I think this would be good for checking if opted in.
    // Will do validation on parameters and then this catch statement can check the error message to ensure we get the right message
  }
};

/**
 * @typedef {Object} Structure
 * @property {algosdk.Transaction} unsignedTxn A unsigned Transaction
 * @property {algosdk.Account | Wallet} senderAcct Wallet or Algosdk Account
 */

/**
 * @typedef {Structure[]} Structures
 */
/**
 *
 * @param {Order} order The Order
 * @param {boolean} [exists] Flag for existing order
 * @param {boolean} [optIn] Flag for opting in
 * @param {string} [closeRemainderTo] Close Account
 * @param {Uint8Array} [note] Optional note field
 * @return {Promise<Structures>}
 */
async function makePlaceAssetTxns(
    order,
    exists = false,
    optIn, // ToDo: talk over the best flow for optIn naming
    closeRemainderTo,
    note,
) {
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  if (typeof order.contract !== 'undefined' && typeof order.contract.entry !== 'string') {
    throw new TypeError('Order must have a valid contract state with an entry!');
  }

  if (order.execution !== 'maker') { // TODO: talk to michael about best way to handle
    // 1 option: change to === taker
    // 2 option: Method that calls this mutates order to "maker" in execution type: "both" situations
    throw new Error('Must be maker only mode!');
  }

  // TODO use optIn
  const makerAlreadyOptedIntoASA = !optIn ? true : await isOptedIn(order.client, order.address, order.asset.id); // Can we assume if the maker is selling an asa they are opted in?
  const lsigAlreadyOptedIntoAsa = await isOptedIn(order.client, order.contract.lsig.address(), order.asset.id); // DISCUSSION: this query implies the existence of an escrow

  exists = lsigAlreadyOptedIntoAsa? true : false;

  order.contract.from = order.address;
  order.contract.to = order.contract.lsig.address();

  order.contract.params = await teal.getTransactionParams(order.client, order.contract.params, true);

  /**
   * Place Asset Structures
   * @type {Structures}
   */


  // const _outerTxns = [{
  //   // Payment Transaction
  //   unsignedTxn: await makeAssetTransferTxn(order, closeRemainderTo, undefined, note), //added undefined so note field matches
  //   senderAcct: order.address,
  // }];

  const _outerTxns = []; // see bottom of file to understand why I changed the ordering/ way we are declaring _outerTxns

  if (!exists) {
    logger.debug({entry: order.contract.entry.slice(59)}, 'Creating new order!');
    /**
     * Application Arguments
     * @type {Array<Uint8Array>}
     */
    const _appArgs = [
      enc.encode('open'),
      // enc.encode(order.contract.entry.slice(59)), // DISCUSSION: we only need to slice 59 to get rid of account ADDR at beggining of string which is not the case here
      enc.encode(order.contract.entry),
      new Uint8Array([order.version]),
    ];

    _outerTxns.push({ // v1 has the above makeAssetTransferTxn in the outerTxns array so removed redeclaration.
      // Payment Transaction
      unsignedTxn: await makePaymentTxn({...order, contract: {...order.contract, amount: 500000}}, closeRemainderTo, note),
      // ^^^ 50000 is Constants.minASAECROWBalance in V1 and also the amount inputed in v1
      senderAcct: order.address,
    });

    // Existing Escrow Transaction
    _outerTxns.push({
      unsignedTxn: await teal.txns.makeTransactionFromLogicSig(
          order.client,
          'appOptIn',
          order.contract.lsig,
          order?.contract?.params,
          order.appId,
          _appArgs,
      ),
      lsig: order.contract.lsig,
    });
  }

  // TODO cleanup, see above. I think this can be safely moved inside exists conditional
  if (!lsigAlreadyOptedIntoAsa) { //
    logger.debug({address: order.contract.lsig.address(), asset: order.asset.id}, 'Opting in!');
    // OptIn Transaction
    _outerTxns.push({
      unsignedTxn: await makeAssetOptInTxn({...order, contract: {...order.contract, from: order.contract.lsig.address()}}),
      senderAcct: order.contract.lsig.address(),
      lsig: order.contract.lsig,

    });
  }

  _outerTxns.push({
    // asset sendTrans
    // Discussion: The ordering really matters for transactions so we cannot have this declared above everything else.
    // If escrow already exists then this is the only transaction in _outerTxns. If it does not exist:
    // we need to send the 3 above transactions representing the initializition of escrow before actually sending the asset to the escrow.
    // Look at /lib/functions/base getPlaceASAToSellASAOrderIntoOrderBook to see what I mean.
    unsignedTxn: await makeAssetTransferTxn(order, closeRemainderTo, undefined, note), // added undefined so note field matches
    senderAcct: order.address,
  });


  return _outerTxns;
}

module.exports = makePlaceAssetTxns;
