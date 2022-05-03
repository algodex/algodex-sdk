const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const getQueuedOrders = require('./getQueuedOrders');
const compile = require('../compile');
const {makePlaceAssetTxns, makePlaceAlgoTxns} = require('../txns');
/**
 *
 * @param {Order} order The Order
 */
async function makeMakerTakerTxns(order) {
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  const queuedOrders = getQueuedOrders(order);
  const total = order.amount;
  let remainder = 0;
  const executeOrders = [];

  // Find Executable Orders
  queuedOrders.forEach((o)=>{
    if (o.contract.amount < total && remainder < total) {
      remainder += o.contract.amount;
      executeOrders.push(o);
    }
  });

  // On Empty Execution, just place Orders
  if (executeOrders.length === 0) {
    return order.type === 'sell' ?
      makePlaceAssetTxns(await compile(order)) :
      makePlaceAlgoTxns(await compile(order));
  } else {
    throw new Error('Need to Create orders!');
  }
}

module.exports = makeMakerTakerTxns;


