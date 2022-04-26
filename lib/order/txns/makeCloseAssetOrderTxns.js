const {
  makeApplicationClearStateTxn,
  makePaymentTxnWithSuggestedParams,
	makeAssetTransferTxnWithSuggestedParams,
  LogicSigAccount,
} = require('algosdk');
const compile = require('../compile');
const logger = require('../../logger');
const teal = require('../../teal');
const enc = require('../../utils/encoder');
const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');


/**
 * Make Close Algo Txns
 *
 * @param {Order} order The Order Object
 * @return {Promise<Structures>}
 */
async function makeCloseAssetOrderTxns(order) {
  logger.debug(order, '✨ Creating - CloseAlgoTxns');
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
  let _order = Object.create(order);

  // Ensure Compile step has run!
  if (typeof _order.contract === 'undefined' || !(_order.contract.lsig instanceof LogicSigAccount)) {
    _order = await compile(_order);
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
          _order.address,
					_order.creator,
					undefined, //revocation target is undefined
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
          _order.address,
          0,
          _order.address, // Eric: This transaction should closeTO orderAddress
          undefined,
          _suggestedParams,

      ),
      lsig: _order.contract.lsig.address()
    },
    {
      // Payment Transaction
      unsignedTxn: makePaymentTxnWithSuggestedParams(
          _order.address,
          _order.address,
          0,
          undefined, // TODO: Should Closeout? Eric: No closeTo for this transaction 
          undefined,
          _suggestedParams,

      ),
      senderAcct: _order.address,
    },
  ];
}

module.exports = makeCloseAssetOrderTxns;
