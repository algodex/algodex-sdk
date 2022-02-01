const algodex = require('./index.js')
const executeOrder = require('./executeOrder.js')
const Big = require('big.js')
const converter = require('./convert.js')

const OrderService = {
  placeOrder: (AlgodClient, order, orderBook) => {

 

    console.log('OrderService.placeOrder', { order })
    const assetId = order.asset.id
    const address = order.address
    const minimumAmount = 0
    // const algodex_environment = 'public_test'
    // const AlgodClient = new algodex.initAlgodClient(algodex_environment)

    const asaAmount = converter.convertToBaseUnits(order.amount, order.asset.decimals)
    const algoAmount = converter.convertToBaseUnits(order.total)

    const price = convertToAsaUnits(order.price, order.asset.decimals)
    const { n: numerator, d: denominator } = algodex.getNumeratorAndDenominatorFromPrice(price)

    if (order.execution === 'maker') {
      if (order.type === 'buy') {
        console.log('Maker buy order', {
          address,
          price,
          assetId,
          algoAmount
        })
        return executeOrder.placeAlgosToBuyASAOrderIntoOrderbook(
          AlgodClient,
          address,
          numerator,
          denominator,
          minimumAmount,
          assetId,
          algoAmount
        )
      } else if (order.type === 'sell') {
        console.log('Maker sell order', {
          address,
          price,
          assetId,
          asaAmount
        })
        return executeOrder.placeASAToSellASAOrderIntoOrderbook(
          AlgodClient,
          address,
          numerator,
          denominator,
          minimumAmount,
          assetId,
          asaAmount
        )
      }
    }

    const isSellOrder = order.type === 'sell'
    const limitPrice = convertToAsaUnits(order.price, order.asset.decimals)

    const allOrderBookOrders = OrderService.getAllEscrowOrders(orderBook)

    if (order.execution === 'taker') {
      console.log(`Taker ${order.type} order`, {
        isSellOrder,
        assetId,
        address,
        limitPrice,
        asaAmount,
        algoAmount
      })
      return executeOrder.executeOrderAsTaker(
        AlgodClient,
        isSellOrder,
        assetId,
        address,
        limitPrice,
        asaAmount,
        algoAmount,
        allOrderBookOrders
      )
    }

    // const marketPrice = order.price

    if (order.execution === 'market') {
      console.log(`Market ${order.type} order`, {
        isSellOrder,
        assetId,
        address,
        limitPrice,
        asaAmount,
        algoAmount
      })
      return executeOrder.executeMarketOrderAsTaker( //First issue is figuring out the organization. Order.js on react uses the methods in index. Talk to Alex about the best way to handle this as there is nuance in the 
        AlgodClient,                     //in the exported methods. (ex. toggling sign and send depending on the order criteria)
        isSellOrder,
        assetId,
        address,
        limitPrice,
        asaAmount,
        algoAmount,
        allOrderBookOrders
      )
    }

    // order.execution === 'both' (default)

    console.log(`Maker/Taker ${order.type} order`, {
      isSellOrder,
      assetId,
      address,
      limitPrice,
      asaAmount,
      algoAmount
    })

    return executeOrder.executeOrderAsMakerAndTaker(
      AlgodClient,
      isSellOrder,
      assetId,
      address,
      limitPrice,
      asaAmount,
      algoAmount,
      allOrderBookOrders
    )
  },

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
        assetId: order.assetId
      }))
    }
    return mapOrders(orderBook.buyOrders, 'buy').concat(mapOrders(orderBook.sellOrders, 'sell'))
  },

  /**
   * Closes an existing order and refunds the escrow account to the owner
   *
   * @param {Object}       algodClient: object that has been initialized via initAlgodClient()
   * @param {String} escrowAccountAddr: public address of the escrow account
   * @param {String}       creatorAddr: public address of the owner of the escrow account
   * @param {String}    orderBookEntry: blockchain order book string. For example "2500-625-0-15322902" (N-D-min-assetId)
   * @param {int}              version: escrow contract version
   * @returns {Object} Promise for when the transaction is fully confirmed
   */
  closeOrder: async (AlgodClient, escrowAccountAddr, creatorAddr, orderBookEntry, version) => {
    return await executeOrder.closeOrderFromOrderBookEntry(
      AlgodClient,
      escrowAccountAddr,
      creatorAddr,
      orderBookEntry,
      version
    )
  }
}

module.exports = OrderService;
