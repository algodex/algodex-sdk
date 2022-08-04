const algosdk = require('algosdk');
const logger = require('../../../logger');
const AlgodError = require('../../../error/AlgodError');
const enc = require('../../../utils/encoder');
const teal = require('../../../teal');

/**
 * # 🏭 makePlaceAssetTxns(order)
 * Factory for creating [Maker]{@tutorial Maker} sell transactions
 *
 * ### ➕ Open Order Transactions:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | SELLER TO ESCROW | {@link algosdk.makeAssetTransferTxn} | Pay from order creator to escrow account | {@link Wallet} |
 * | TXN 1 | ESCROW TO ORDERBOOK | {@link algosdk.makePaymentTxn} | Stateful app opt-in to order book | {@link algosdk.LogicSigAccount} |
 * | TXN 2 | ESCROW TO ESCROW | {@link algosdk.makeAssetTransferTxn} | (Optional) ASA opt-in for the newly created escrow account  | {@link algosdk.LogicSigAccount} |
 * | TXN 3 | SELLER TO ESCROW | {@link algosdk.makeAssetTransferTxn} | Asset transfer Txn representing the amount of asset moved to escrow | {@link Wallet} |
 *
 *
 *
 *
 * @param {Order} order The Order
 * @param {boolean} [optIn] Flag for if the escrow has opted in
 * @return {Promise<Structures>}
 * @throws ValidationError
 * @memberOf module:txns/sell
 */
async function makePlaceAssetTxns(
    order,
    optIn=false,
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

  if (order.contract?.amount === 0) {
    throw new Error('Cannot place a maker order with a 0 Amount');
  }

  if (order.execution !== 'maker') {
    throw new Error('Must be maker only mode!');
  }

  let _optIn = optIn;
  // TODO: Remove, just use order.wallet['assets] and only fetch if it doesn't exist
  if (typeof order?.wallet?.assets === 'undefined' && !_optIn) {
    logger.warn({address: order.address}, 'Loading account info!');
    const {account: accountInfo} = await order.indexer.lookupAccountByID(order.contract.lsig.address()).do();
    if (accountInfo != null && accountInfo['apps-local-state'] != null &&
      accountInfo['apps-local-state'].length > 0 &&
      accountInfo['apps-local-state'][0].id === order.appId) {
      _optIn = true;
    }
  }

  // const _exists = typeof order?.contract?.creator !== 'undefined';
  const _suggestedParams = await teal.getTransactionParams(order.client, order.contract.params, true);


  // Main Transaction
  const assetSendTxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      order.address,
      order.contract.lsig.address(),
      undefined,
      undefined,
      order.contract.amount,
      undefined,
      order.asset.id,
      _suggestedParams,
      undefined,
  );

  // Lisg has opted in, return the transfer transaction
  // NOTE: This is an early return!
  if (_optIn) {
    return [{
      unsignedTxn: assetSendTxn,
      needsUserSig: true,
      senderAcct: order.address,
    }];
  }

  const _appArgs = [
    enc.encode('open'),
    enc.encode(order.contract.entry.slice(59)),
    new Uint8Array([order.version]),
  ];

  /**
   * Place Asset Structures
   * @type {Structures}
   */
  return [
    // Payment Transaction
    {
      unsignedTxn: algosdk.makePaymentTxnWithSuggestedParams(
          order.address,
          order.contract.lsig.address(),
          500000, // TODO: Move back to constants MIN_ASA_ESCROW_BALANCE
          undefined,
          undefined,
          _suggestedParams,
      ),
      senderAcct: order.address,
    },
    // Application OptIn Transaction
    {
      unsignedTxn: await teal.txns.makeTransactionFromLogicSig(
          order.client,
          'appOptIn',
          order.contract.lsig,
          _suggestedParams,
          order.appId,
          _appArgs,
      ),
      lsig: order.contract.lsig,
    },
    // LogSigAssetOptIn Transaction
    {
      unsignedTxn: algosdk.makeAssetTransferTxnWithSuggestedParams(
          order.contract.lsig.address(),
          order.contract.lsig.address(),
          undefined,
          undefined,
          0,
          undefined,
          order.asset.id,
          _suggestedParams,
      ),
      lsig: order.contract.lsig,
    },
    // Asset Transfer Transaction
    {
      unsignedTxn: assetSendTxn,
      senderAcct: order.address,
    },
  ];
}

module.exports = makePlaceAssetTxns;
