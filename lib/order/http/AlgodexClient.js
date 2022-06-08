/*
 * Algodex REST API Interface
 *
 * Includes all responses from the publicly exposed routes
 *
 * @author Alexander Trefonas
 * @author Michael Feher
 * @copyright Algonaut Inc
 */
const Big = require('big.js');
const HTTPClient = require('../../http/HTTPClient.js');
const floatToFixed = require('../../utils/format/floatToFixed');
const calculateAsaBuyAmount = require('../../utils/calc/toAlgoAmount');
const convertFromAsaUnits = require('../../utils/units/fromAsaUnits');
const dayjs = require('dayjs');
const logger = require('pino')({
  level: process.env.LOG_LEVEL || 'error',
});

/**
 * # 🕸 Algodex HTTP Client
 *
 * Used to connect to the Algodex REST endpoints
 *
 * @TODO: Generate from OAS/Swagger
 * @param {string} baseUrl Base URL to use for API requests
 * @param {boolean} [etags] Flag to enable Etag on GET Requests
 * @extends HTTPClient
 * @ignore
 * @constructor
 */
function AlgodexClient(baseUrl, etags=true) {
  // Apply client
  const client = new HTTPClient(baseUrl, etags);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Extend from HTTPClient
AlgodexClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(AlgodexClient.prototype, {
  /**
   *
   * @param {object} ob Orderbook Object
   * @return {Order} A Order Object
   **/
  mapOrderbookToOrders(ob) {
    const price =parseFloat(ob.price);
    const amount = parseFloat(ob.formattedASAAmount);
    return {
      execution: 'execute',
      client: ob.client,
      indexer: ob.indexer,
      address: ob.orderCreatorAddr,
      type: ob.escrowOrderType,
      price,
      amount,
      total: price * amount,
      appId: parseInt(ob.appId),
      asset: {
        id: ob.assetId,
      },
      contract: {
        N: ob.n,
        D: ob.d,
        min: ob.min,
        entry: ob.orderEntry,
        escrow: ob.escrowAddr,
        creator: ob.orderCreatorAddr,
      },
      version: ob.version,
    };
  },
  /**
   *
   * @param {Object} orderBook
   * @return {*}
   */
  mapToAllEscrowOrders(orderBook) {
    if (!Array.isArray(orderBook.buy)) {
      throw new TypeError('Buy orders must be an array');
    }
    if (!Array.isArray(orderBook.sell)) {
      throw new TypeError('Sell orders must be an array');
    }
    const mapOrders = (orders, type) => {
      return orders.map((order) => {
        return {
        // TODO: Move to standard Orders
        // type,
        // asset: {
        //   id: order.assetId,
        // },
        // price: fromBaseUnits(order.assetLimitPriceInAlgos),
        // amount: type === 'buy', order.algoAmount || order.asaAmount
        // contract: {
        //   entry: `${order.assetLimitPriceN}-${order.assetLimitPriceD}-${order.minimumExecutionSizeInAlgo}-${order.assetId}`,
        //   N: order.assetLimitPriceN,
        //   D: order.assetLimitPriceD,
        //   min: order.minimumExecutionSizeInAlgo,
        //   escrow: order.escrowAddress,
        //   algoBalance: order.algoAmount,
        //   asaBalance: order.asaAmount,
        // },
          client: order.client,
          orderEntry: `${order.assetLimitPriceN}-${order.assetLimitPriceD}-${order.minimumExecutionSizeInAlgo}-${order.assetId}`,
          price: order.assetLimitPriceInAlgos,
          formattedASAAmount: order.formattedASAAmount,
          n: parseInt(order.assetLimitPriceN),
          d: parseInt(order.assetLimitPriceD),
          min: order.minimumExecutionSizeInAlgo,
          version: order.version,
          escrowAddr: order.escrowAddress,
          algoBalance: order.algoAmount,
          asaBalance: order.asaAmount,
          escrowOrderType: type,
          isASAEscrow: type === 'sell',
          orderCreatorAddr: order.ownerAddress,
          assetId: order.assetId,
          appId: order.appId,
        };
      });
    };
    return mapOrders(orderBook.buy, 'buy').concat(mapOrders(orderBook.sell, 'sell'));
  },
  /**
   * Convert to standard orders list
   * @param {Order[]} orders
   * @param {number} asaDecimals
   * @param {"buy"|"sell"} type
   * @return {*}
   */
  aggregateOrders(orders, asaDecimals, type) {
    if (!Array.isArray(orders)) {
      throw new TypeError('Orders must be an array!');
    }
    const isBuyOrder = type === 'buy';
    let total = 0;
    const leftPriceDecimalsLength = orders.map((order) => {
      const price = new Big(convertFromAsaUnits(order.asaPrice, asaDecimals));
      const left = Math.floor(price);
      const right = price.sub(left);

      return right !== 0 && right.toString().length > 2 ?
        right.toString().length - 2 :
        0;
    });

    const decimalLength =
      leftPriceDecimalsLength.length === 0 ?
        0 :
        Math.max(...leftPriceDecimalsLength);

    const sortOrdersToAggregate = (a, b) => {
      if (isBuyOrder) {
        return b.asaPrice - a.asaPrice;
      }
      return a.asaPrice - b.asaPrice;
    };

    const reduceAggregateData = (result, order) => {
      const _price = convertFromAsaUnits(order.asaPrice, asaDecimals);
      const price = floatToFixed(_price, 6, decimalLength);
      const orderAmount = isBuyOrder ? order.algoAmount : order.asaAmount;

      const amount = isBuyOrder ?
        calculateAsaBuyAmount(price, orderAmount) :
        parseFloat(order.formattedASAAmount);

      total += amount;

      const index = result.findIndex((obj) => obj.price === price);

      if (index !== -1) {
        result[index].amount += amount;
        result[index].total += amount;
        return result;
      }

      result.push({
        price,
        amount,
        total,
      });
      return result;
    };

    const sortRowsByPrice = (a, b) => {
      return b.price - a.price;
    };

    return orders.sort(sortOrdersToAggregate)
        .reduce(reduceAggregateData, [])
        .sort(sortRowsByPrice);
  },
  /**
   *
   * @param {object} data
   * @return {null|*}
   */
  mapOpenOrdersData(data) {
    if (
      !data ||
      !data.buyASAOrdersInEscrow ||
      !data.sellASAOrdersInEscrow ||
      !data.allAssets
    ) {
      return null;
    }

    const {
      buyASAOrdersInEscrow: buyOrdersData,
      sellASAOrdersInEscrow: sellOrdersData,
      allAssets: assetsData,
    } = data;

    const assetsInfo = assetsData.reduce((allAssetsInfo, currentAssetInfo) => {
      allAssetsInfo[currentAssetInfo.index] = currentAssetInfo;
      return allAssetsInfo;
    }, {});

    const buyOrders = buyOrdersData.map((order) => {
      const {assetId, formattedPrice, formattedASAAmount, unix_time} = order;
      return {
        asset: {id: assetId},
        date: dayjs.unix(unix_time).format('YYYY-MM-DD HH:mm:ss'),
        // date: moment(unix_time, 'YYYY-MM-DD HH:mm').format(),
        unix_time: unix_time,
        price: floatToFixed(formattedPrice),
        pair: `${assetsInfo[assetId].params['unit-name']}/ALGO`,
        type: 'BUY',
        status: 'OPEN',
        amount: formattedASAAmount,
        metadata: order,
      };
    });

    const sellOrders = sellOrdersData.map((order) => {
      const {assetId, formattedPrice, formattedASAAmount, unix_time} = order;

      return {
        asset: {id: assetId},
        date: dayjs.unix(unix_time).format('YYYY-MM-DD HH:mm:ss'),
        unix_time: unix_time,
        price: floatToFixed(formattedPrice),
        pair: `${assetsInfo[assetId].params['unit-name']}/ALGO`,
        type: 'SELL',
        status: 'OPEN',
        amount: formattedASAAmount,
        metadata: order,
      };
    });

    const allOrders = [...buyOrders, ...sellOrders];
    allOrders.sort((a, b) => (a.unix_time < b.unix_time ? 1 : -1));
    return allOrders;
  },
  /**
   *
   * @param {object} data
   * @return {null|*}
   */
  mapTradeHistoryData(data) {
    const buySide = 'BUY';
    const sellSide = 'SELL';
    if (!data || !data.transactions || !data.allAssets) {
      return null;
    }

    const {transactions: tradeHistoryData, allAssets: assetsData} = data;

    const assetsInfo = assetsData.reduce((allAssetsInfo, currentAssetInfo) => {
      allAssetsInfo[currentAssetInfo.index] = currentAssetInfo;
      return allAssetsInfo;
    }, {});

    return tradeHistoryData.map(
        ({
          unix_time,
          asset_id,
          tradeType,
          formattedPrice,
          formattedASAAmount,
        }) => {
          const side = tradeType === 'buyASA' ? buySide : sellSide;

          return {
            id: asset_id,
            date: dayjs(unix_time * 1000).format('YYYY-MM-DD HH:mm:ss'),
            price: floatToFixed(formattedPrice),
            pair: `${assetsInfo[asset_id].params['unit-name']}/ALGO`,
            side,
            amount: formattedASAAmount,
          };
        },
    );
  },
  /**
   * Fetch Orders by Type
   *
   * Reduces the response to the standard Orders Object
   *
   * @param {'wallet'|'asset'} type Type of fetch, wallet or asset
   * @param {string} id Index of the resource
   * @return {Promise<Array<Order>>}
   */
  async fetchOrders(type, id) {
    let res;

    if (type === 'wallet') {
      res = await this.fetchWalletOrders(id);
    } else if (type === 'asset') {
      res = await this.fetchAssetOrders(id);
    }

    return this.mapToAllEscrowOrders({
      buy: res.buyASAOrdersInEscrow,
      sell: res.sellASAOrdersInEscrow,
    }).map((o)=> this.mapOrderbookToOrders(o));
  },
  /**
   * Fetch Asset's Chart
   *
   * Returns OHLCV(Open, High, Low, Close, Volume) response from the API.
   * Used in lightweight-charts to display the Candlestick and Area views.
   *
   * @param {number|string} id Unique Asset Identifier
   * @param {string} interval Time interval to aggregate data on
   * @return {Promise<Object>}
   */
  async fetchAssetChart(id, interval) {
    logger.debug(`fetchAssetChart(${id}, ${interval})`);
    const res = await this.get(
        `${this.baseUrl}/charts2.php?assetId=${id}&chartTime=${interval}`,
    );
    return res.data;
  },

  /**
   * Fetch Asset's Orders
   * @param {number|string} id Unique Asset Identifier
   * @return {Promise<Object>}
   */
  async fetchAssetOrders(id) {
    logger.debug(`fetchAssetOrders(${id})`);
    const url = `${this.baseUrl}/orders.php?assetId=${id}`;
    const res = await this.get(url);
    return res.data;
  },

  /**
   *
   * Fetch Wallet's Orders
   *
   * @TODO: Deprecate includeAssetInfo
   * @param {string} address Account Address
   * @param {boolean} includeAssetInfo Should fetch asset info
   * @return {Promise<Object>}
   */
  async fetchWalletOrders(address, includeAssetInfo = true) {
    logger.debug(
        `fetchOpenOrdersByAddress(${address}, ${includeAssetInfo})`,
    );
    const res = await this.get(
        `${this.baseUrl}/orders.php?ownerAddr=${address}` +
      `&getAssetInfo=${includeAssetInfo}`,
    );
    return res.data;
  },

  /**
   * Fetch Asset's Trade History
   *
   * @param {string | number} id
   * @return {Promise<Object>}
   */
  async fetchAssetTradeHistory(id) {
    logger.debug(`fetchAssetTradeHistory(${id})`);
    const res = await this.get(
        `${this.baseUrl}/trade_history.php?assetId=${id}`,
    );
    return res.data;
  },

  /**
   * Fetch Wallet's Trade History
   * @param {string} address
   * @param {boolean} includeAssetInfo
   * @return {Promise<Object>}
   */
  async fetchWalletTradeHistory(address, includeAssetInfo = true) {
    logger.debug(`fetchWalletTradeHistory(${address}, ${includeAssetInfo})`);
    const res = await this.get(
        `${this.baseUrl}/trade_history.php?ownerAddr=${address}` +
      `&getAssetInfo=${includeAssetInfo}`,
    );
    return res.data;
  },

  /**
   * Fetch Wallet's Assets
   * @param {string} address
   * @return {Promise<Object>}
   */
  async fetchWalletAssets(address) {
    logger.debug(`fetchWalletAssets(${address})`);
    const res = await this.get(
        `${this.baseUrl}/wallet_assets.php?ownerAddr=${address}`,
    );
    return res.data;
  },

  /**
   * Search for Assets
   * @param {string} query
   * @return {Promise<{assets: any}>}
   */
  async searchAssets(query) {
    logger.debug(`searchAssets(${query})`);
    const res = await this.get(
        `${this.baseUrl}/asset_search.php?query=${query}`,
    );
    return {assets: res.data};
  },

  /**
   * Fetch Assets
   *
   * Return all available Assets in Algodex.
   *
   * @return {Promise<*>}
   */
  async fetchAssets() {
    logger.debug('fetchAssets()');
    const {
      data: {data},
    } = await this.get(`${this.baseUrl}/assets.php`);
    return data;
  },

  /**
   * Fetch Asset's Price
   *
   * Get Asset state from Algodex
   *
   * @param {string|number} id
   * @return {Promise<*>}
   */
  async fetchAssetPrice(id) {
    logger.debug(`fetchAssetPrice(${id})`);
    const res = await this.get(`${this.baseUrl}/assets.php?id=${id}`);
    const {
      data: {data},
    } = res;
    return data[0];
  },
});

module.exports = AlgodexClient;
