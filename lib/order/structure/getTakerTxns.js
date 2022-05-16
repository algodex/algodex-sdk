const {getQueuedTakerOrders} = require('../../functions/base');
const withTakerOrderInformation = require('./withTakerOrderInformation');
const withCutTakerTxns = require('./withCutTakerTxns');
const withExecuteAlgoOrderTxns = require('../txns/buy/withExecuteAlgoOrderTxns');
const withExecuteAssetOrderTxns = require('../txns/sell/withExecuteAssetOrderTxns');
const withLogicSigAccount = require('../compile/withLogicSigAccount');
const toBaseUnits = require('../../utils/units/toBaseUnits.js');


// NOTE: toBaseUnits rounds which can cause the logic to break in certain situations.
// Ex. buying with total amount 1 algo. If escrowSellPrice is 255.0007
// 1/255.0007 = 0.003921557862390182
// toBaseUnits(0.003921557862390182) = 3922
// 3922 * 255.0007 = 1000112.7454 which is more than the total and also not an integer.
// SOLUTION: floor the calculation instead of rounding so it will never go over the total.
// dowside, slifgtly overpays escrow
function decimalAdjust(type, value, exp) {
  // If the exp is undefined or zero...
  if (typeof exp === 'undefined' || +exp === 0) {
    return Math[type](value);
  }
  value = +value;
  exp = +exp;
  // If the value is not a number or the exp is not an integer...
  if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
    return NaN;
  }
  // Shift
  value = value.toString().split('e');
  value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
  // Shift back
  value = value.toString().split('e');
  return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
}

const floor = (value, exp) => decimalAdjust('floor', value, exp);

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
        order.asset.orderbook;


  // Optimization: Do not concat in dexd.mapToAllEscrowOrders
  // getQueuedTakerOrders seperates them again. we could change to just sort passed in array
  // base on type. No need to filter
  const queuedOrders = getQueuedTakerOrders(order.address, order.type === 'sell', _orderbook);

  const firstOrder = queuedOrders[0]; // rough implementation will change name/ placement later

  if (
    (order.type === 'buy' && order.price < firstOrder.price) || (order.type === 'sell' && order.price > firstOrder.price)
  ) {
    console.warn('Wrong execution mode. Taker was specified but no orders exist at the price.');
    return []; // empty array so we can only send to if order.contraxt.txns.length > 0
  }

  if (
    (order.type === 'buy' && order.contract.amount > firstOrder.asaBalance) ||
        (order.type === 'sell' && order.contract.total > firstOrder.algoBalance) // used to be amount but I think it should be total
  ) {
    order.asset.orderbook = _orderbook;
    order.asset.queuedOrders = queuedOrders;
    return await withCutTakerTxns(await withTakerOrderInformation(order));
  } else {
    order.asset.orderbook = _orderbook;
    // const orderWithEscrow = { ...order, }

    const queuedOrderForLsig = {
      min: firstOrder.min,
      contract: {
        N: firstOrder.n,
        D: firstOrder.d,
        creator: firstOrder.orderCreatorAddr,
      },
      version: firstOrder.version,
      address: firstOrder.orderCreatorAddr,
      type: firstOrder.escrowOrderType,
      asset: {id: firstOrder.assetId},
      appId: order.appId,
      client: order.client,
    };
    const escrowLsig = await withLogicSigAccount(queuedOrderForLsig);

    const tradeAmount = order.type === 'buy' ?
            toBaseUnits(floor((order.total / firstOrder.price), -6)) :
            order.contract.amount;
    // if user triggered buy order, amount is the user specified total divided by the buyer's price. Rounded down for edgecases (see above note)
    // if user triggered sell order, amount is amount specified.

    const orderWithEscrowLsig = {
      ...order,
      contract: {
        ...order.contract,
        ...escrowLsig.contract,
        amount: tradeAmount,
        total: order.contract.total,
        entry: firstOrder.orderEntry,
      },
      wallet: {
        address: order.address,
      },
    };
    return order.type === 'sell' ?
            await withExecuteAlgoOrderTxns(orderWithEscrowLsig) :
            await withExecuteAssetOrderTxns(orderWithEscrowLsig);
  }
}

module.exports = getTakerTxns;
