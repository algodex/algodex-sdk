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
const HTTPClient = require('../HTTPClient.js');
const floatToFixed = require('../../utils/format/floatToFixed');
const calculateAsaBuyAmount = require('../../utils/calc/toAlgoAmount');
const convertFromAsaUnits = require('../../utils/units/fromAsaUnits');
const dayjs = require('dayjs');
// TODO: Implement getLogger() from '@algodex/common'

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
   * Convert to standard orders list
   * @param orders
   * @param asaDecimals
   * @param type
   * @return {*}
   */
  aggregateOrders(orders, asaDecimals, type) {
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
   * @return {null|*[]}
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
   * @param data
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
    console.debug(`fetchAssetChart(${id}, ${interval})`);
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
    console.debug(`fetchAssetOrders(${id})`);
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
    console.debug(
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
    console.debug(`fetchAssetTradeHistory(${id})`);
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
    console.debug(`fetchWalletTradeHistory(${address}, ${includeAssetInfo})`);
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
    console.debug(`fetchWalletAssets(${address})`);
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
    console.debug(`searchAssets(${query})`);
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
    console.debug('fetchAssets()');
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
    console.debug(`fetchAssetPrice(${id})`);
    const res = await this.get(`${this.baseUrl}/assets.php?id=${id}`);
    const {
      data: {data},
    } = res;
    return data[0];
  },
});

module.exports = AlgodexClient;
