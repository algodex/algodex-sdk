const {
  makeApplicationClearStateTxn,
  makePaymentTxnWithSuggestedParams,
  makeAssetTransferTxnWithSuggestedParams,
  LogicSigAccount,
} = require('algosdk');
const logger = require('../../../logger');
const teal = require('../../../teal');
const enc = require('../../../utils/encoder');
const algosdk = require('algosdk');
const AlgodError = require('../../../error/AlgodError');


/**
 * # 🏭 makeCloseAssetTxns(order)
 * > Transaction Factory for Closing Sell Orders
 *
 * ### ❌ Cancel Order Transactions:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | ESCROW TO ORDERBOOK | {@link algosdk.makeApplicationClearStateTxn} | Application call to order book contract for closeout | {@link algosdk.LogicSigAccount} |
 * | TXN 1 | ESCROW TO SELLER | {@link algosdk.makeAssetTransferTxnWithSuggestedParams} | Asset transfer (escrow to owner) | {@link algosdk.LogicSigAccount} |
 * | TXN 2 | ESCROW TO SELLER | {@link algosdk.makePaymentTxnWithSuggestedParams} | Pay transaction (from escrow to owner) | {@link algosdk.LogicSigAccount} |
 * | TXN 3 | SELLER TO SELLER | {@link algosdk.makePaymentTxnWithSuggestedParams} |  proof of ownership pay transaction (owner to owner) | {@link Wallet} |
 *
 * @param {Order} order The Order Object
 * @return {Promise<Transactions>}
 * @memberOf module:txns/sell
 */
async function makeCloseAssetTxns(order) {
  logger.debug('✨ Creating - CloseAlgoTxns');
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  /**
   * Order Object
   * @type {Order}
   * @private
   */
  const _order = Object.create(order);

  // Ensure Compile step has run!
  if (!(_order.contract.lsig instanceof LogicSigAccount)) {
    // _order = await compile(_order);
    throw new Error('Invalid Lsig');
  }

  /**
   * Application Arguments
   * @type {Uint8Array[]}
   * @private
   */
  const _appArgs = [
    enc.encode('close'),
    enc.encode(order.contract.entry),
  ];

  // Fetch Suggested Params from Cache
  const _suggestedParams = await teal.getTransactionParams(
      _order.client,
      _order?.contract?.params,
      true,
  );

  return [
    {
      // Clear State Transaction
      unsignedTxn: makeApplicationClearStateTxn(
          _order.contract.lsig.address(),
          _suggestedParams,
          _order.appId,
          _appArgs,
      ),
      lsig: _order.contract.lsig,
    },
    {
      // Close Out Escrow Payment Transaction
      unsignedTxn: makeAssetTransferTxnWithSuggestedParams(
          _order.contract.lsig.address(),
          _order.contract.creator,
          _order.contract.creator,
          undefined, // revocation target is undefined
          0,
          undefined,
          _order.asset.id,
          _suggestedParams,
      ),
      lsig: _order.contract.lsig,
    },
    {
      // Payment Transaction
      unsignedTxn: makePaymentTxnWithSuggestedParams(
          _order.contract.lsig.address(),
          _order.contract.creator,
          0,
          _order.contract.creator, // Eric: This transaction should closeTO orderAddress
          undefined,
          _suggestedParams,

      ),
      lsig: _order.contract.lsig,
    },
    {
      // Payment Transaction
      unsignedTxn: makePaymentTxnWithSuggestedParams(
          _order.contract.creator,
          _order.contract.creator,
          0,
          undefined, // TODO: Should Closeout? Eric: No closeTo for this transaction
          undefined,
          _suggestedParams,

      ),
      senderAcct: _order.contract.creator,
    },
  ];
}

module.exports = makeCloseAssetTxns;
