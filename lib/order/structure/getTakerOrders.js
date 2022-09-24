/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// const withExecuteTxns = require('./taker/withExecuteTxns');
const getTakerOrderInformation = require('./taker/getTakerOrderInformation');
const getCutTakerOrders = require('./taker/getCutTakerOrders');
// const fromBaseUnits = require('../../utils/units/fromBaseUnits');
const logger = require('../../logger');

/**
 *
 * @param {string} takerWalletAddr
 * @param {boolean} isSellingAssetAsTakerOrder
 * @param {Object[]}  allOrderBookOrders
 * @return {Array}
 * @ignore
 */
function getQueuedTakerOrders(
    takerWalletAddr,
    isSellingAssetAsTakerOrder,
    allOrderBookOrders,
) {
  const queuedOrders = [];
  // getAllOrderBookEscrowOrders is UI dependant and needs to be customized for the React version

  if (allOrderBookOrders == null || allOrderBookOrders.length === 0) {
    return;
  }

  // FIXME: don't allow executions against own orders! check wallet address doesn't match
  // takerWalletAddr

  for (let i = 0; i < allOrderBookOrders.length; i++) {
    const orderBookEntry = allOrderBookOrders[i];

    if (orderBookEntry['escrowOrderType'] === 'buy' && !isSellingAssetAsTakerOrder) {
      // only look for sell orders in this case
      continue;
    }
    if (orderBookEntry['escrowOrderType'] === 'sell' && isSellingAssetAsTakerOrder) {
      // only look for buy orders in this case
      continue;
    }
    orderBookEntry.price = parseFloat(orderBookEntry.price);

    queuedOrders.push(orderBookEntry);
  }

  if (isSellingAssetAsTakerOrder) {
    // sort highest first (index 0) to lowest (last index)
    // these are buy orders, so we want to sell to the highest first
    queuedOrders.sort((a, b) => (a.price < b.price) ? 1 : (a.price === b.price) ? ((a.price < b.price) ? 1 : -1) : -1);
  } else {
    // sort lowest first (index 0) to highest (last index)
    // these are sell orders, so we want to buy the lowest first
    queuedOrders.sort((a, b) => (a.price > b.price) ? 1 : (a.price === b.price) ? ((a.price > b.price) ? 1 : -1) : -1);
  }

  return queuedOrders;
}

/**
 * @deprecated
 * @param {number} assetId
 * @param {AlgodexApi} api
 * @return {Promise<*>}
 * @ignore
 */
async function getOrderbook(assetId, api) {
  logger.warn(`Fetching Orderbook for ${assetId}`);
  const res = await api.http.dexd.fetchAssetOrders(assetId);

  return api.http.dexd.mapToAllEscrowOrders({
    buy: res.buyASAOrdersInEscrow,
    sell: res.sellASAOrdersInEscrow,
  });
}


/**
 *
 * * # 🏃 getTakerOrders
 *
 * Accepts an {@link Order} with execution of [Taker]{@tutorial Taker} and matches the criteria with [Executable]{@tutorial Executable} orders in the [Orderbook]{@tutorial Orderbook}.
 *
 * If executable orders exist then the relevant transactions are generated.
 *
 * The generated transactions fall into one of the two categories below:
 * ### SingleOrderExecution
 * **Condition:** For when the desired user "total" amount is less than the available escrow amount
 *  * Example: There is an order in the orderbook at the user's desired price and desired amount
 *
 * **Return value:** An array of length=1 containing {@link Order} object with an txnArr attached to the contract
 *
 *
 * ### MultiOrderExececution
 * **Condition:** For when the desired user total amount is greater than the available escrow amount
 *  * Example: There are multiple orders in the orderbook at the user's desired price, but no entry contains the user's desired amount.
 *
 * **Return value:** An array of variable length.  Each item represents a group of transactions.
 *
 * ### When is it used?
 * This method and the corresponding factories are used anytime a user is executing upon an existing [Algodex Orderbook]{@tutorial Orderbook} [Order]{@link Order}.
 *
 * This method is used to generate the taker transactions in [getMakerTakerTxns]{@link module/structure.getMakerTakerTxns}
 *
 * This method would be ideal for use in algorithmic trading strategies.
 *
 * @example
 * const [AlgodexAPI]{@link AlgodexApi} = require(@algodex/algodex-sdk)
 * const api = new [AlgodexAPI]{@link AlgodexApi}(require('../config.json'))
 * const order = {
 *   "client": api.algod,
 *   "indexer": api.indexer,
 *   "asset": {
 *     "id": 15322902,
 *     "decimals": 6,
 *   },
 *   "address": "TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I",
 *   "price": 2.22,
 *   "amount": 1,
 *   "total": 2,
 *   "execution": "taker",
 *   "type": "buy",
 *   "appId": 22045503,
 *   "version": 6
 * }
 *
 * // Scenario: singleOrder
 * //order.execution === 'taker'
 * let res = await getTakerOrders(api, order)
 * console.log(res.contract.txns)
 * //Outputs an array with structure of:
 * [makeExecuteAssetTxns]{@link module:txns/sell.makeExecuteAssetTxns} || [makeExecuteAlgoTxns]{@link module:txns/buy.makeExecuteAlgoTxns}
 *
 *
 *
 * @example
 * const [AlgodexAPI]{@link AlgodexApi} = require(@algodex/algodex-sdk)
 * const api = new [AlgodexAPI]{@link AlgodexApi}(require('../config.json'))
 * const order = {
 *   "client": api.algod,
 *   "indexer": api.indexer,
 *   "asset": {
 *     "id": 15322902,
 *     "decimals": 6,
 *   },
 *   "address": "TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I",
 *   "price": 2.22,
 *   "amount": 1,
 *   "total": 2,
 *   "execution": "taker",
 *   "type": "buy",
 *   "appId": 22045503,
 *   "version": 6
 * }
 * // Scenario: multiOrder
 * //order.execution === 'taker'
 * let res = await getTakerOrders(api, order)
 * console.log(res)
 * //Outputs an array with each item being:
 * [withExecuteAssetTxns]{@link module:txns/sell.withExecuteAssetTxns} || [withExecuteAlgoTxns]{@link module:txns/buy.withExecuteAlgoTxns}
 *
 * @param {AlgodexApi} api The Algodex API
 * @param {Order} order The User's Order
 * @return {Promise<Structure[]>}
 * @throws ValidationError
 * @see [makeExecuteAssetTxns]{@link module:txns/sell.makeExecuteAssetTxns} || [makeExecuteAlgoTxns]{@link module:txns/buy.makeExecuteAlgoTxns} ||  [withExecuteAssetTxns]{@link module:txns/sell.withExecuteAssetTxns} || [withExecuteAlgoTxns]{@link module:txns/buy.withExecuteAlgoTxns}
 * @memberOf module:order/structure
 */
async function getTakerOrders(api, order) {
  if (order.execution !== 'taker' && order.execution !== 'market' && order.execution !== 'both') {
    throw new TypeError(`Unsupported execution of ${order.execution}, use [taker, market, both] for automated orderbook matching`);
  }

  // Fetch Orderbook if it doesn't exist
  const _orderbook = !order.asset?.orderbook ?
        // TODO: Move to new Orderbook Shape
        await getOrderbook(order.asset.id, api) :
        order.asset.orderbook;

  // Clone Object for mutations
  const _order = {...order, asset: {...order.asset, orderbook: _orderbook}};

  /**
     * @todo Move to new Orderbook Shape, send User's Order instance as the first parameter
     * @type {Array}
     */
  const _queuedOrders = getQueuedTakerOrders(_order.address, _order.type === 'sell', _orderbook);

  // Exit if no taker orders
  if (_queuedOrders.length === 0) {
    logger.warn({address: order.address, type: _order.type},
        'No orders exist for user to execute',
    );
    // Exit early
    return [];
  }

  /**
     * First Order
     * @type {Order}
     */
  const _firstOrder = _queuedOrders[0]; // rough implementation will change name/ placement later

  /**
     * Balance of the First Order
     * @type {Number}
     */
  // const firstOrderBalance = fromBaseUnits(
  //       _order.type === 'buy' ?
  //           _firstOrder.asaBalance :
  //           _firstOrder.algoBalance/ _firstOrder.price, // to get assetAmount
  // );
  //   We want to see if the escrow amount is larger than order amount because comparing by order total can lead to unexpected results
  // If user is selling below market price we want to make sure they get the best deal possible for their "amount" sold so we should ignore their total.


  /**
     * Check to see if the order fits
     * @type {boolean}
     */
  // const isMultiOrderExecution = _order.amount > firstOrderBalance;
  //   We should always check by amounts, totals can be misleading when users input prices that over/under


  /**
     * Flag for if the User's order has Executable Orders
     * @type {boolean}
     */
  const isExecutable = _order.
      type === 'buy' ?
        _order.price >= _firstOrder.price :
        _order.price <= _firstOrder.price;


  // No Taker Orders Found
  if (!isExecutable) {
    logger.warn({
      userPrice: _order.price, totalOrders: _queuedOrders.length, spreadPrice: _firstOrder.price,
    }, 'No orders exist at the price.');
    // Exit early
    return [];
  }

  // User's order "fits" into the top order. Execute against that order
  // if (!isMultiOrderExecution) {
  //   // Closeout if the order matches the balance
  //   const withCloseout = firstOrderBalance === _order.total;
  //
  //   const _price = parseFloat(_firstOrder.price);
  //   /**
  //        * Mapped Order from API
  //        *
  //        * @todo This should come from the API and we should only need to set amount/total
  //        * @type {Order}
  //        * @private
  //        */
  //   const _mappedOrder = {
  //     execution: 'execute',
  //     client: _order.client,
  //     indexer: api.indexer,
  //     address: _firstOrder.orderCreatorAddr,
  //     type: _firstOrder.escrowOrderType,
  //     price: _price,
  //     amount: _order.amount,
  //     total: _price * _order.amount,
  //     appId: parseInt(_firstOrder.appId),
  //     asset: {
  //       id: _firstOrder.assetId,
  //     },
  //     contract: {
  //       N: _firstOrder.n,
  //       D: _firstOrder.d,
  //       min: _firstOrder.min,
  //       entry: _firstOrder.orderEntry,
  //       escrow: _firstOrder.escrowAddr,
  //       creator: _firstOrder.orderCreatorAddr,
  //     },
  //     version: _firstOrder.version,
  //     wallet: _order.wallet,
  //   };
  //
  //   // Return an Array with the compiled order
  //   return [await withExecuteTxns(_mappedOrder, withCloseout)];
  // }
  //
  // // Order is overflowing, split it and generate TakerTxns
  // if (isMultiOrderExecution) {
  // TODO: Handle Market Orders
  return await getCutTakerOrders(
      api,
      {..._order, indexer: api.indexer},
      _queuedOrders,
      await getTakerOrderInformation({..._order, indexer: api.indexer}, _queuedOrders));
  // }
}

module.exports = getTakerOrders;
