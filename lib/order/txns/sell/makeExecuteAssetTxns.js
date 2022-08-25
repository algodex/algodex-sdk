const algosdk = require('algosdk');
const logger = require('../../../logger');
const AlgodError = require('../../../error/AlgodError');
const enc = require('../../../utils/encoder');
const teal = require('../../../teal');
const getOptedIn = require('../../../wallet/getOptedIn');

/**
 * # 🏭 makeExecuteAssetTxns(order)
 *
 *   ### ☠ Partial Order Execution:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | ESCROW TO ORDERBOOK | {@link algosdk.makeApplicationNoOpTxn} | Application call to execute | {@link Wallet} |
 * | TXN 1 | BUYER TO SELLER  | {@link algosdk.makePaymentTxn} | Pay transaction (from buyer/executor to escrow owner | {@link algosdk.LogicSigAccount} |
 * | TXN 2 | BUYER TO BUYER | {@link algosdk.makeAssetTransferTxn} | (Optional) asset opt-in transaction (for buyer/executor) | {@link Wallet} |
 * | TXN 2/3 | ESCROW TO BUYER | {@link algosdk.makeAssetTransferTxn} | Asset transfer (from escrow to buyer/executor) | {@link Wallet} |
 * | TXN 3/4 | BUYER TO ESCROW | {@link algosdk.makePaymentTxn} | Pay transaction for fee refund (from buyer/executor to escrow) | {@link Wallet} |
 *
 *
 *
 * ### ☠️ Full Order Execution:
 *
 * | Index | Direction | Type | Description | Signer |
 * | ----- | --------- | ---- | ----------- | ------ |
 * | TXN 0 | ESCROW TO ORDERBOOK | {@link algosdk.makeApplicationCloseOutTxn} | Transaction must be a call to a stateful contract | {@link Wallet} |
 * | TXN 1 | BUYER TO SELLER | {@link algosdk.makePaymentTxnWithSuggestedParams} |  Pay transaction (from buyer/executor to escrow owner) | {@link Wallet} |
 * | TXN 2 | BUYER TO BUYER | {@link algosdk.makeAssetTransferTxn} | (Optional) asset opt-in transaction (for buyer/executor) | {@link Wallet} |
 * | TXN 2/3 | ESCROW TO BUYER | {@link algosdk.makeAssetTransferTxn} |  Asset transfer (from escrow to buyer/executor) - closes out any remaining ASA to seller (escrow owner) as well | {@link Wallet} |
 * | TXN 3/4 | ESCROW TO SELLER | {@link algosdk.makePaymentTxn} | Pay transaction to close out to escrow owner | {@link Wallet} |
 *
 *
 *
 * #
 *
 * @param {Order} order The Order
 * @param {boolean} [withCloseout] Flag to closeout the executable order
 * @return {Promise<Transactions>}
 * @memberOf module:txns/sell
 */
async function makeExecuteAssetTxns(
    order,
    withCloseout,
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

  if (order.execution === 'maker') {
    throw new Error('Must be maker only mode!');
  }


  // TODO use optIn
  const _optedIn = await getOptedIn(order.indexer, order.wallet, order.asset.id); // why are we passing the address when the method expects an object?
  // ToDO: discuss the below
  // This is part of ensuring the splitTransactions remain unique

  const _selectedEscrowOrder = order?.orderBookEscrowEntry;

  order.contract.params = {
    ...await teal.getTransactionParams(order.client, order.contract.params, true), // not sure if this needs updating. Is the cache hiding the error?
    flatFee: false,
    fee: 0,
  };

  /**
       * taker Asset Structures
       * @type {Structures}
       */

  /**
         * Application Arguments
         * @type {Array}
         */
  const _appAccts = [
    order.contract.creator,
    order.wallet.address,
  ];

  //   scrappy way to add batch uniqueness without encoding extra appArg
  const uniqueNote = enc.encode(`${Math.random()}`);

  /**
         * Application Arguments
         * @type {Array<Uint8Array>}
         */
  const _appArgs = [
    enc.encode(
            withCloseout ?
                'execute_with_closeout' :
                'execute',
    ),
    enc.encode(order.contract.entry), // Will there ever be an entry that includes the address, if so .slice(59)?
    // new Uint8Array([order.version]),
  ];

  if (typeof _selectedEscrowOrder?.txnNum === 'number') _appArgs.push(enc.encode(_selectedEscrowOrder.txnNum));

  const _outerTxns = [{
    // Payment Transaction
    unsignedTxn: withCloseout ?
            algosdk.makeApplicationCloseOutTxn(
                order.contract.lsig.address(),
                order.contract.params,
                order.appId,
                _appArgs,
                _appAccts,
                [0],
                [order.asset.id],
                uniqueNote) :
            algosdk.makeApplicationNoOpTxn(
                order.contract.lsig.address(),
                order.contract.params,
                order.appId,
                _appArgs,
                _appAccts,
                [0],
                [order.asset.id],
                uniqueNote),

    lsig: order.contract.lsig,
  }];

  //   Transaction rerpresenting taker address paying escrowCreator for asset
  _outerTxns.push({
    unsignedTxn: algosdk.makePaymentTxnWithSuggestedParams(
        order.wallet.address,
        order.contract.creator,
        order.contract.total,
        undefined, // was breaking because passing closeToRemainder in makePaymentTxn
        uniqueNote,
        order.contract.params,
        undefined,
    ),
    senderAcct: order.wallet.address,
  });

  if (!_optedIn) {
    logger.debug({address: order.address, asset: order.asset.id}, 'Opting in!');
    // OptIn Transaction
    _outerTxns.push({
      unsignedTxn: algosdk.makeAssetTransferTxnWithSuggestedParams(
          order.wallet.address,
          order.wallet.address,
          undefined,
          undefined,
          0,
          uniqueNote,
          order.asset.id,
          order.contract.params,
          undefined,
      ),
      senderAcct: order.wallet.address,
    });
  }

  //   Payment represents escrow sending asset to taker
  _outerTxns.push({
    unsignedTxn: algosdk.makeAssetTransferTxnWithSuggestedParams(
        order.contract.lsig.address(),
        order.wallet.address,
        withCloseout ? order.contract.creator : undefined, // undefined unless shouldClose === true
        undefined,
        order.contract.amount,
        uniqueNote,
        order.asset.id,
        order.contract.params,
        undefined,
    ),
    lsig: order.contract.lsig,
  });

  const refundFees = 0.002 * 1000000; // this was what refund fees were in v1

  _outerTxns.push(withCloseout ? { // TODO: Make sure that you check the sell side to see if that conditional needs modification
    unsignedTxn:
            algosdk.makePaymentTxnWithSuggestedParams(
                order.contract.lsig.address(),
                order.contract.creator,
                0,
                order.contract.creator,
                undefined,
                order.contract.params,
            ),


    lsig: order.contract.lsig,

  } : {
    unsignedTxn: algosdk.makePaymentTxnWithSuggestedParams(
        order.wallet.address,
        order.contract.lsig.address(),
        refundFees,
            withCloseout ? order.contract.creator : undefined,
            uniqueNote,
            order.contract.params,
            undefined,
    ),
    senderAcct: order.wallet.address,
  },
  );

  return _outerTxns;
}

module.exports = makeExecuteAssetTxns;
