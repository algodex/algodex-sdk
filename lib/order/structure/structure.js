/** @module order/structure **/
const algosdk = require('algosdk');
const withCloseAlgoTxns = require('../txns/close/withCloseAlgoTxns');
const withCloseAssetTxns = require('../txns/close/withCloseAssetTxns');
const getMakerTakerTxns = require('./getMakerTakerOrders');
const withMakerTxns = require('./maker/withMakerTxns');
const withExecuteTxns = require('./taker/withExecuteTxns');
const getTakerOrders = require('./getTakerOrders');
const compile = require('../compile');
const logger = require('../../logger');


/**
 * ## 🏗 [Structure Order](#structure)
 *
 * 🏗 &nbsp;&nbsp; Takes an {@link Order} and structures the underlying transactions
 *
 * 🎚 &nbsp;&nbsp; Structure switches based on the execution property of the {@link Order}
 *
 * 💽 &nbsp;&nbsp; The structured transactions are stored in the contract property under txns
 *
 * ### When is it used?
 * This method is what enables [AlgodexApi.placeOrder]{#placeOrder} to handle every execution and order type
 * @example
 * const {AlgodexApi} = require('@algodex/sdk')
 * const order = structure(new AlgodexApi(), {
 *   "client": new algosdk.Algodv2(),
 *   "asset": {
 *     "id": 15322902,
 *     "decimals": 6,
 *   },
 *   "address": "TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I",
 *   "price": 2.22,
 *   "amount": 1,
 *   "total": 2,
 *   "execution": "maker",
 *   "type": "buy",
 *   "appId": 22045503,
 *   "version": 6
 * })
 * // Outputs Array of Objects with txns attached to contract property
 *
 * @param {AlgodexApi} api AlgodexApi Instance
 * @param {Order} order The compiled Order Object
 * @return {Promise<Order[]>} Array of structured Order Objects
 */
async function structure(api, order) {
  logger.debug(`Structure order with '${order.execution}' transactions`);
  if (!(order?.client instanceof algosdk.Algodv2)) throw new TypeError('Must have valid algod client!!!');

  let orders;

  switch (order.execution) {
    // Place Order into Orderbook, single order with outerTxns
    case 'maker':
      orders = [await withMakerTxns(api, await compile({...order, indexer: api.indexer}))];
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
                [await withCloseAlgoTxns(order)]:
                [await withCloseAssetTxns(order)];
      break;

    case 'both':
      orders = await getMakerTakerTxns(api, order);
      break;

    default:
      throw new TypeError('execution property must be one of the following: maker, taker, cancel, both');
  }

  return orders;
}


module.exports = structure;
