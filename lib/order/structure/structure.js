const algosdk = require('algosdk');
const withCloseAlgoTxns = require('../txns/close/withCloseAlgoOrderTxns');
const withCloseAssetTxns = require('../txns/close/withCloseAssetOrderTxns');
const withMakerTakerTxns = require('./withMakerTakerTxns');
const withMakerTxns = require('./maker/withMakerTxns');
const withExecuteTxns = require('./taker/withExecuteTxns');
const getTakerOrders = require('./getTakerOrders');
const compile = require('../compile');

/**
 * @param {AlgodexApi} api AlgodexApi Instance
 * @param {Order} order The Order Object
 * @return {Promise<Array<Order>>}
 */
async function structure(api, order) {
  if (!(order?.client instanceof algosdk.Algodv2)) throw new TypeError('Must have valid algod client!!!');

  let orders;

  switch (order.execution) {
    // Place Order into Orderbook, single order with outerTxns
    case 'maker':
      orders = [await withMakerTxns(api, await compile(order))];
      break;
    // Execute Orders in the Orderbook,
    case 'taker':
    case 'market':
      // TODO: Support Market Orders in getTakerOrders
      orders = await getTakerOrders(api, order);
      break;
    case 'execute':
      orders = [await withExecuteTxns(await compile(order))];
      break;

    case 'close':
      orders = order.type === 'buy' ?
                await withCloseAlgoTxns(order) :
                await withCloseAssetTxns(order);
      break;

    case 'both':
      orders = await withMakerTakerTxns(api, order);
      break;

    default:
      throw new TypeError('execution property must be one of the following: maker, taker, cancel, both');
  }

  return orders;
}


module.exports = structure;
