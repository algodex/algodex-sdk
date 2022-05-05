const AlgodError = require('../../error/AlgodError');
const logger = require('../../logger');
const getStructureLoopCheck = require('./getStructureLoopCheck');
const getSplitTimesByIter = require('./getSplitTimesByIter');
const getRunningBalance = require('./getRunningBalance');
const cutQueuedOrder = require('./withCutQueuedOrder');
const structureSingleTransListWithAllTransList = require('./getTxnOrderNumber');
const withExecuteAssetOrderTxns = require('../txns/sell/withExecuteAssetOrderTxns');
const withExecuteAlgoOrderTxns = require('../txns/buy/withExecuteAlgoOrderTxns');
const updateTakerBalance = require('./updateTakerBalance');

// TODO: make sure this is accurate
const withLogicSigAccount = require('../compile/withLogicSigAccount');
const withQueuedOrder = require('./withQueuedOrder');
const algosdk = require('algosdk');


/**
 * ## ✉ makeCutTakerTxns
 * Accepts takerOrderBalance and a queuedOrders array
 * and determines the final structure of takerTxns
 * will sometimes be a batch of smaller transactions
 * whose sum is equal to the user inputted amount
 *
 * @param {Object} order One object to rule them all...
 *
 * @return {Object} An object with array of taker transactions which as a whole represents the taker side .
 * @memberOf module:order/structures
 */
async function withCutTakerTxns(order) {
    if (!(order.client instanceof algosdk.Algodv2)) {
        throw new AlgodError('Order must have a valid SDK client');
    }

    if (typeof order.appId !== 'number') {
        throw new TypeError('Must have valid Application Index');
    }

    if (typeof order.contract !== 'undefined' && typeof order.contract.entry !== 'string') {
        throw new TypeError('Order must have a valid contract state with an entry!');
    }

    if (typeof order.takerOrderBalance === 'undefined') {
        throw new TypeError('Must have a takerOrderBalance object property attached to the Order Object');
    }

    if (!Array.isArray(order.asset.queuedOrders)) {
        throw new TypeError('Must have an array of queuedOrders attached to order.asset');
    }

    const {
        asset: {
            queuedOrders,
        },
    } = order;
    const _isSellingAsset = order.type === 'sell';

    let txOrderNum = 0;
    let groupNum = 0;
    let lastExecutedPrice = -1;
    const allTransList = [];


    for (let i = 0; i < queuedOrders.length; i++) {
        if (!getStructureLoopCheck(
            order.takerOrderBalance,
            _isSellingAsset,
            queuedOrders[i]['price'])) {
            break;
        }

        const { cutOrder, splitTimes } = getSplitTimesByIter(queuedOrders[i], i);

        let runningBalance = getRunningBalance(queuedOrders[i]);

        let outerBreak = false;
        for (let jj = 0; jj < splitTimes; jj++) {
            if (runningBalance <= 0) {
                throw new Error('Unexpected 0 or below balance');
            }
            logger.debug(
                'running balance: ' +
                runningBalance +
                ' isASAEscrow: ' +
                queuedOrders[i].isASAEscrow,
            );

            const cutQueuedOrderObject = {
                queuedOrder: queuedOrders[i],
                cutOrder: cutOrder,
                splitTimes: splitTimes,
                loopIndex: jj,
                runningBalance: runningBalance,
            };

            const queuedOrder = cutQueuedOrder(cutQueuedOrderObject);

            const queuedOrderForLsig = {
                min: queuedOrder.min,
                contract: {
                    N: queuedOrder.n,
                    D: queuedOrder.d,
                },

                version: queuedOrder.version,
                address: queuedOrder.orderCreatorAddr,
                type: queuedOrder.escrowOrderType,
                asset: { id: queuedOrder.assetId },
                appId: order.appId,
                client: order.client,

            };


            const escrowLsig = await withLogicSigAccount(queuedOrderForLsig);
            order.contract.escrow = escrowLsig.contract.escrow;
            order.contract.lsig = escrowLsig.contract.lsig;


            const updatedTakerOrderBalance = updateTakerBalance(queuedOrder, order.takerOrderBalance, queuedOrder.isASAEscrow);
            if (updatedTakerOrderBalance === 'escrowEmpty') {
                outerBreak = true;
                break;
            }

            order = {
                ...order,
                takerOrderBalance: {
                    ...updatedTakerOrderBalance, // updateTakerOrderBalance returns the entire takerOrderBalanceObject
                }
            };



            const singleOrderTransList =
                !queuedOrder.isASAEscrow ?
                    await withExecuteAlgoOrderTxns(...withQueuedOrder(order, queuedOrder)) :
                    await withExecuteAssetOrderTxns(...withQueuedOrder(order, queuedOrder)); //destructure to keep with statements 1 to 1 with makes


            if (singleOrderTransList == null) {
                // Overspending issue
                outerBreak = true;
                break;
            }

            // Taking out final price check for now because new paymentStructure does not append data found in v1 structures
            // const [algo, asa] = getAlgoandAsaAmounts(singleOrderTransList);


            // finalPriceCheck(algo, asa, takerOrderBalance.limitPrice, _isSellingAsset);

            lastExecutedPrice = queuedOrder['price'];
            // Be Warned: allTransList is persisted via a side effect
            const newTxnOrderNum = structureSingleTransListWithAllTransList(
                singleOrderTransList, allTransList, txOrderNum, groupNum,
            );
            txOrderNum = newTxnOrderNum; // so next loop remembers total
            groupNum++;
            runningBalance -= cutOrder != null ? cutOrder.cutOrderAmount : 0;
        }
        if (outerBreak) {
            break;
        }
    }

    return {
        ...order,

        takerOrderBalance: {
            ...order.takerOrderBalance,
            allTransList: allTransList,
            currentOrderValues: {
                lastExecutedPrice: lastExecutedPrice,
                groupNum: groupNum,
                txOrderNum: txOrderNum,
            },
        },
    };
}

module.exports = withCutTakerTxns;


