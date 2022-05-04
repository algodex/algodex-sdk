const {
  makeApplicationClearStateTxn,
  makePaymentTxnWithSuggestedParams,
  LogicSigAccount,
} = require('algosdk');
const compile = require('../../compile');
const logger = require('../../../logger');
const teal = require('../../../teal');
const enc = require('../../../utils/encoder');
const algosdk = require('algosdk');
const AlgodError = require('../../../error/AlgodError');


/**
 * Make Close Algo Txns
 *
 * By default, orders from the API are designed for executions. They use the escrow
 * address as the order address. The contract.creator key will always be the owner
 * of the escrow. If the contract.creator key exists, it is an existing escrow order
 *
 * @param {Order} order The Order Object
 * @return {Promise<Structures>}
 */
async function makeCloseAlgoOrderTxns(order) {
  logger.debug(order, '✨ Creating - CloseAlgoTxns');
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  if (typeof order?.contract?.creator !== 'string') {
    throw new TypeError('Must have a valid contract creator!!!');
  }
  /**
   * Order Object
   * @type {Order}
   * @private
   */
  let _order = Object.create(order);

  // Ensure Compile step has run!
  if (!(_order.contract.lsig instanceof LogicSigAccount)) {
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
      unsignedTxn: makePaymentTxnWithSuggestedParams(
          _order.contract.lsig.address(),
          _order.contract.creator,
          0,
          _order.contract.creator, // TODO should close out? Eric: in this case it should closeTo orderCreator
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
      senderAcct: _order.address,
    },
  ];
}

module.exports = makeCloseAlgoOrderTxns;
