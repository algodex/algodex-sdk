/** @module order/structure **/
const algosdk = require('algosdk');
const withCloseAlgoTxns = require('../txns/close/withCloseAlgoOrderTxns');
const withCloseAssetTxns = require('../txns/close/withCloseAssetOrderTxns');
const getMakerTakerTxns = require('./getMakerTakerTxns');
const withMakerTxns = require('./maker/withMakerTxns');
const withExecuteTxns = require('./taker/withExecuteTxns');
const getTakerOrders = require('./getTakerOrders');
const compile = require('../compile');
const logger = require('../../logger');


/**
 * ## 🏗 [Structure Order](#structure)
 *
 * Takes a compiled {@link Order} and structures the underlying transactions.
 * The path's structure can take is dictated by the execution type of the orderObject
 * The structured transactions are stored in the contranct property under txns.
 *
 * @example
 * const {
 * AlgodexApi,
 * order: {structure, compile}
 * } = require('@algodex/sdk')
 * const order = structure(new AlgodexApi(), compile({
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
 * }))
 * // Outputs Array of Objects with txns attached to contract property
 *
 * @param {AlgodexApi} api AlgodexApi Instance
 * @param {Order} order The compiled Order Object
 * @return {Promise<Order[]>} Array of structured Order Objects
 * @memberOf module:order/structure
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
                await withCloseAlgoTxns(order) :
                await withCloseAssetTxns(order);
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
