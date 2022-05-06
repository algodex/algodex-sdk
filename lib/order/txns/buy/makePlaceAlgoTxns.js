const algosdk = require('algosdk');
const logger = require('../../../logger');
const AlgodError = require('../../../error/AlgodError');
const enc = require('../../../utils/encoder');
const teal = require('../../../teal');

const makePaymentTxn = require('../makePaymentTxn');
const makeAssetOptInTxn = require('../makeAssetOptInTxn');
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
async function makePlaceAlgoTxns(
    order,
    exists = false,
    optIn = false,
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

    if (order.execution !== 'maker') {
        throw new Error('Must be maker only mode!');
    }

    // TODO use optIn
    let makerAlreadyOptedIntoASA = false;

    // TODO: Remove, just use order.wallet['assets] and only fetch if it doesn't exist
    if (typeof order?.wallet?.assets === 'undefined') {
        logger.warn({ address: order.address }, 'Loading account info!');
        const makerAccountInfo = await order.client.accountInformation(order.address).do();
        if (makerAccountInfo != null && makerAccountInfo['assets'] != null &&
            makerAccountInfo['assets'].length > 0) {
            for (let i = 0; i < makerAccountInfo['assets'].length; i++) {
                if (makerAccountInfo['assets'][i]['asset-id'] === order.asset.id) {
                    makerAlreadyOptedIntoASA = true;
                    break;
                }
            }
        }
    }


    order.contract.from = order.address;
    order.contract.to = order.contract.lsig.address();

    order.contract.params = await teal.getTransactionParams(order.client, order.contract.params, true);

    /**
     * Place Algo Structures
     * @type {Structures}
     */

    //NOTE for Michael: Amount is always ASA amount. When generating an algo payment you have to multiply by order.price
    const _outerTxns = [{
        // Payment Transaction 
        unsignedTxn: await makePaymentTxn({
            ...order,
            contract: {
                ...order.contract,
                amount: order.contract.amount * order.price
            }

        }),
        senderAcct: order.address,
    }];

    if (!exists) {
        logger.debug({ entry: order.contract.entry.slice(59) }, 'Creating new order!');
        /**
         * Application Arguments
         * @type {Array<Uint8Array>}
         */
        const _appArgs = [
            enc.encode('open'),
            enc.encode(order.contract.entry.slice(59)),
            new Uint8Array([order.version]),
        ];

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

    // TODO cleanup, see above
    if (!makerAlreadyOptedIntoASA) {
        logger.debug({ address: order.address, asset: order.asset.id }, 'Opting in!');
        // OptIn Transaction
        _outerTxns.push({
            unsignedTxn: await makeAssetOptInTxn(order),
            senderAcct: order.address,
        });
    }

    return _outerTxns;
}

module.exports = makePlaceAlgoTxns;
