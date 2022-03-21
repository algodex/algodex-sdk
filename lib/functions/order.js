const algodex = require('../AlgodexApi.js');
const executeOrder = require('./executeOrder.js');
const converter = require('./convert.js');
const isUndefined = require('lodash').isUndefined;
/**
 * Order Service
 *
 * Interface for placing Orders in Algodex
 * Returns orderService object with necessary methods for order execution
 *
 * @param {Object}         AlgodClient: instance of AlgodClient needed for order Execution
 * @param {Object}         order: the order that the user placed
 * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
 * @returns {Object}       Promise for when the order succeeds or fails?
 */
// function OrderService({sdk, config}) {
//   if(typeof sdk !== 'undefined' && sdk instanceof AlgodexAPI){
//     this.sdk = sdk
//     if(typeof config !== 'undefined') this.sdk.setConfig(config)
//   } else {
//      this.sdk = new AlgodexAPI(config)
//   }
//   if(typeof this.sdk.wallets !== 'undefined' && !(this.sdk.wallets instanceof WalletService))
//     throw new Error('Invalid Wallet Configuration')
//   else if (typeof this.sdk.wallets !== 'undefined' && this.sdk.wallets instanceof WalletService)
//     this.wallets = this.sdk.wallets
//   else
//     this.wallets = new WalletService(config)
// }

/**
 * @deprecated
 */
const OrderService = {
  /**
   * @deprecated
   * @param config
   */
  constructor({config}) {
    if (!new.target) {
      throw Error('Cannot be called without the new keyword');
    }
    // TODO: Check configuration
    this.setClient(config);
    this.emit = this.client.emit;
    this.on = this.client.on;
  },

  /**
   *
   * @param client
   * @param config
   * @deprecated
   */
  setClient({client, ...config}) {
    const hasClient = !isUndefined(client);
    if (hasClient && !(client instanceof algodex)) {
      throw new Error('Invalid Client');
    }
    // TODO: Validate
    // this.client = hasClient ? client : new algodex(config);
  },
  /**
   * Execute Wrapper
   *
   * Execute on an Order against the OrderBook
   *
   * Example Abstraction
   * @param {Object} properties               Service Properties
   * @param {Object} properties.order         The standard Order Object
   * @param {Object} [properties.orders]      Optional list of Buy/Sell Orders
   * @param {Object} [properties.config]      Configuration for SDK
   * @return {Promise<*>}
   * @deprecated
   */
  async placeOrder({order, orders: _orders, config}) {
    // Check we have a valid Order
    if (typeof order === 'undefined') {
      throw new Error('Must have valid order');
    }

    // Configure SDK
    if (typeof config !== 'undefined') {
      this.setClient(config);
    }

    // Ensure we have a wallet service
    if (isUndefined(this.client.wallets) || !(this.client.wallets instanceof WalletService)) {
      throw new Error('Invalid Wallet');
    }

    // Fetch Orders
    let orders;
    if (typeof _orders === 'undefined') {
      orders = await this.getOrders(order);
    } else {
      orders = _orders;
    }

    const asaAmount = converter.convertToBaseUnits(order.amount, order.asset.decimals);
    const algoAmount = converter.convertToBaseUnits(order.total);

    const price = converter.convertToAsaUnits(order.price, order.asset.decimals);
    const {n: numerator, d: denominator} = algodex.getNumeratorAndDenominatorFromPrice(price);

    // Execute the Order
    return this.client.executeOrder(
        undefined,
        order.type === 'sell',
        order.assetId,
        order.address,
        price,
        asaAmount,
        algoAmount,
        orders,
        order.execute === 'maker',
    );
  },
  /**
   * @deprecated
   */
  getOrders() {

  },
  /**
   *
   * @param AlgodClient
   * @param order
   * @param orderBook
   * @param walletConnection
   * @return {Promise<*>}
   * @deprecated
   */
  placeOrderOriginal(AlgodClient, order, orderBook, walletConnection=undefined ) {
    console.log('OrderService.placeOrder', {order});
    const assetId = order.asset.id;
    const address = order.address;
    const minimumAmount = 0;

    const asaAmount = converter.convertToBaseUnits(order.amount, order.asset.decimals);
    const algoAmount = converter.convertToBaseUnits(order.total);

    const price = converter.convertToAsaUnits(order.price, order.asset.decimals);
    const {n: numerator, d: denominator} = algodex.getNumeratorAndDenominatorFromPrice(price);

    if (order.execution === 'maker') {
      if (order.type === 'buy') {
        console.log('Maker buy order', {
          address,
          price,
          assetId,
          algoAmount,
        });
        return executeOrder.placeAlgosToBuyASAOrderIntoOrderbook(
            AlgodClient,
            address,
            numerator,
            denominator,
            minimumAmount,
            assetId,
            algoAmount,
            walletConnection,
        );
      } else if (order.type === 'sell') {
        console.log('Maker sell order', {
          address,
          price,
          assetId,
          asaAmount,

        });
        return executeOrder.placeASAToSellASAOrderIntoOrderbook(
            AlgodClient,
            address,
            numerator,
            denominator,
            minimumAmount,
            assetId,
            asaAmount,
            walletConnection,
        );
      }
    }

    const isSellOrder = order.type === 'sell';
    const limitPrice = converter.convertToAsaUnits(order.price, order.asset.decimals);

    const allOrderBookOrders = (Array.isArray(orderBook) || !orderBook) ? orderBook : OrderService.getAllEscrowOrders(orderBook); // if orderbook is array then no need to concatenate. (experimental-next has dif orderbook structure)
    if (order.execution === 'taker') {
      console.log(`Taker ${order.type} order`, {
        isSellOrder,
        assetId,
        address,
        limitPrice,
        asaAmount,
        algoAmount,
      });
      return executeOrder.executeOrderAsTaker(
          AlgodClient,
          isSellOrder,
          assetId,
          address,
          limitPrice,
          asaAmount,
          algoAmount,
          allOrderBookOrders,
          walletConnection,
      );
    }


    if (order.execution === 'market') {
      console.log(`Market ${order.type} order`, {
        isSellOrder,
        assetId,
        address,
        limitPrice,
        asaAmount,
        algoAmount,
      });
      return executeOrder.executeMarketOrderAsTaker(
          AlgodClient,
          isSellOrder,
          assetId,
          address,
          limitPrice,
          asaAmount,
          algoAmount,
          allOrderBookOrders,
          walletConnection,
      );
    }

    console.log(`Maker/Taker ${order.type} order`, {
      isSellOrder,
      assetId,
      address,
      limitPrice,
      asaAmount,
      algoAmount,
    });

    return executeOrder.executeOrderAsMakerAndTaker(
        AlgodClient,
        isSellOrder,
        assetId,
        address,
        limitPrice,
        asaAmount,
        algoAmount,
        allOrderBookOrders,
        walletConnection,
    );
  },

  /**
   *
   * @param orderBook
   * @return {*}
   * @deprecated
   */
  getAllEscrowOrders: (orderBook) => {
    const mapOrders = (orders, type) => {
      return orders.map((order) => ({
        orderEntry: `${order.assetLimitPriceN}-${order.assetLimitPriceD}-${order.minimumExecutionSizeInAlgo}-${order.assetId}`,
        price: order.assetLimitPriceInAlgos,
        n: order.assetLimitPriceN,
        d: order.assetLimitPriceD,
        min: order.minimumExecutionSizeInAlgo,
        version: order.version,
        escrowAddr: order.escrowAddress,
        algoBalance: order.algoAmount,
        asaBalance: order.asaAmount,
        escrowOrderType: type,
        isASAEscrow: type === 'sell',
        orderCreatorAddr: order.ownerAddress,
        assetId: order.assetId,
      }));
    };
    return mapOrders(orderBook.buyOrders, 'buy').concat(mapOrders(orderBook.sellOrders, 'sell'));
  },

  /**
   * Closes an existing order and refunds the escrow account to the owner
   *
   * @param {Object}       algodClient: object that has been initialized via initAlgodClient()
   * @param {String} escrowAccountAddr: public address of the escrow account
   * @param {String}       creatorAddr: public address of the owner of the escrow account
   * @param {String}    orderBookEntry: blockchain order book string. For example "2500-625-0-15322902" (N-D-min-assetId)
   * @param {int}              version: escrow contract version
   * @return {Object} Promise for when the transaction is fully confirmed
   * @deprecated
   */
  closeOrder: async (AlgodClient, escrowAccountAddr, creatorAddr, orderBookEntry, version) => {
    return await executeOrder.closeOrderFromOrderBookEntry(
        AlgodClient,
        escrowAccountAddr,
        creatorAddr,
        orderBookEntry,
        version,
    );
  },
};
// TODO: wrap in deprecate()
module.exports = OrderService;
