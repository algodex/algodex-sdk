const withExecuteTxns = require('./taker/withExecuteTxns');
const makeExecuteAssetTxns = require('../txns/sell/makeExecuteAssetTxns');
const makeExecuteAlgoTxns = require('../txns/buy/makeExecuteAlgoTxns');
const getTakerOrderInformation = require('./taker/getTakerOrderInformation');
const getCutTakerOrders = require('./taker/getCutTakerOrders');
const fromBaseUnits = require('../../utils/units/fromBaseUnits');
const logger = require('../../logger');

/**
 *
 * @param {string} takerWalletAddr
 * @param {boolean} isSellingAssetAsTakerOrder
 * @param {Object[]}  allOrderBookOrders
 * @return {Array}
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
 * // NOTE: toBaseUnits rounds which can cause the logic to break in certain situations.
 * // Ex. buying with total amount 1 algo. If escrowSellPrice is 255.0007
 * // 1/255.0007 = 0.003921557862390182
 * // toBaseUnits(0.003921557862390182) = 3922
 * // 3922 * 255.0007 = 1000112.7454 which is more than the total and also not an integer.
 * // SOLUTION: floor the calculation instead of rounding so it will never go over the total.
 * // dowside, slifgtly overpays escrow
 * @todo Investigate
 * @param type
 * @param value
 * @param exp
 * @return {number}
 */
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

/**
 * @deprecated
 * @param assetId
 * @param api
 * @return {Promise<*>}
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
 * * # 🏗 [getTakerOrders](#structure)
 *
 * Takes a compiled {@link Order} and generates the corresponding executable taker order if it exists in the orderbook.
 * There are two takerOrder flows:
 * ### SingleOrderExecution
 * **Condition:** For when the desired user "total" amount is less than the available escrow amount
 *
 * **Description:** An array of length=1 containing {@link Order} Object with output of:
 *
 *
 * * User buy order: [makeExecuteAssetTxns]{@link module:txns/sell.makeExecuteAssetTxns}
 *
 *
 * * User sell order: [makeExecuteAlgoTxns]{@link module:txns/buy.makeExecuteAlgoTxns}
 *
 * attached to the contract.
 * ### MultiOrderExececution
 * **Condition:** For when the desired user total amount is greater than the available escrow amount
 *
 * **Description:** An array of variable length. Each item has format {@link Order} with txn array in contract.
 *
 *
 * Each item represents a group of transactions.
 *
 *  To send MultiOrderExecution see (Link to signing info)
 *
 *
 *
 *
 * @param {AlgodexApi} api The Algodex API
 * @param {Order} order The User's Order
 * @return {Promise<Structure[]>}
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
  const firstOrderBalance = fromBaseUnits(
        _order.type === 'buy' ?
            _firstOrder.asaBalance :
            _firstOrder.algoBalance/ _firstOrder.price, // to get assetAmount
  );
  //   We want to see if the escrow amount is larger than order amount because comparing by order total can lead to unexpected results
  // If user is selling below market price we want to make sure they get the best deal possible for their "amount" sold so we should ignore their total.


  /**
     * Check to see if the order fits
     * @type {boolean}
     */
  const isMultiOrderExecution = _order.amount > firstOrderBalance;
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
  if (!isMultiOrderExecution) {
    // Closeout if the order matches the balance
    const withCloseout = firstOrderBalance === _order.total;

    const _price = parseFloat(_firstOrder.price);
    /**
         * Mapped Order from API
         *
         * @todo This should come from the API and we should only need to set amount/total
         * @type {Order}
         * @private
         */
    const _mappedOrder = {
      execution: 'execute',
      client: _order.client,
      indexer: api.indexer,
      address: _firstOrder.orderCreatorAddr,
      type: _firstOrder.escrowOrderType,
      price: _price,
      amount: _order.amount,
      total: _price * _order.amount,
      appId: parseInt(_firstOrder.appId),
      asset: {
        id: _firstOrder.assetId,
      },
      contract: {
        N: _firstOrder.n,
        D: _firstOrder.d,
        min: _firstOrder.min,
        entry: _firstOrder.orderEntry,
        escrow: _firstOrder.escrowAddr,
        creator: _firstOrder.orderCreatorAddr,
      },
      version: _firstOrder.version,
      wallet: _order.wallet,
    };

    // Return an Array with the compiled order
    return [await withExecuteTxns(_mappedOrder, withCloseout)];
  }

  // Order is overflowing, split it and generate TakerTxns
  if (isMultiOrderExecution) {
    // TODO: Handle Market Orders
    return await getCutTakerOrders(
        api,
        {..._order, indexer: api.indexer},
        _queuedOrders,
        await getTakerOrderInformation({..._order, indexer: api.indexer}, _queuedOrders));
  }
}

module.exports = getTakerOrders;
