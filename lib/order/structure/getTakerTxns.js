const { getQueuedTakerOrders } = require('../../functions/base')
const withTakerOrderInformation = require('./withTakerOrderInformation')
const withCutTakerTxns = require('./withCutTakerTxns')
const withExecuteAlgoOrderTxns = require('../txns/buy/withExecuteAlgoOrderTxns');
const withExecuteAssetOrderTxns = require('../txns/sell/withExecuteAssetOrderTxns');
const withLogicSigAccount = require('../compile/withLogicSigAccount');
const toBaseUnits = require('../../utils/units/toBaseUnits.js');


async function getOrderbook(assetId, api) {
    const res = await api.http.dexd.fetchAssetOrders(assetId);

    return api.http.dexd.mapToAllEscrowOrders({
        buy: res.buyASAOrdersInEscrow,
        sell: res.sellASAOrdersInEscrow,
    });
}



async function getTakerTxns(api, order) {
    const _orderbook = !order.asset?.orderbook ?
        await getOrderbook(order.asset.id, api) :
        order.asset.orderbook


    // Optimization: Do not concat in dexd.mapToAllEscrowOrders
    // getQueuedTakerOrders seperates them again. we could change to just sort passed in array
    // base on type. No need to filter
    const queuedOrders = getQueuedTakerOrders(order.address, order.type === 'sell', _orderbook);

    const firstOrder = queuedOrders[0]

    if (order.contract.amount > firstOrder.asaBalance) {
        return await withCutTakerTxns(await withTakerOrderInformation(order))

    } else {
        order.asset.orderbook = _orderbook
        // const orderWithEscrow = { ...order, }

        const queuedOrderForLsig = {
            min: firstOrder.min,
            contract: {
                N: firstOrder.n,
                D: firstOrder.d,
                creator: firstOrder.orderCreatorAddr
            },


            version: firstOrder.version,
            address: firstOrder.orderCreatorAddr,
            type: firstOrder.escrowOrderType,
            asset: { id: firstOrder.assetId },
            appId: order.appId,
            client: order.client,

        };
        const escrowLsig = await withLogicSigAccount(queuedOrderForLsig)
        const orderWithEscrowLsig = {
            ...order,
            contract: {
                ...order.contract,
                ...escrowLsig.contract,
                amount: toBaseUnits(order.total / firstOrder.price),
                total: order.contract.total,
                entry: firstOrder.orderEntry

            },
            wallet: {
                address: order.address
            }
        }


        return order.type === 'sell' ?
            await withExecuteAlgoOrderTxns(orderWithEscrowLsig) :
            await withExecuteAssetOrderTxns(orderWithEscrowLsig);

    }
}

module.exports = getTakerTxns
