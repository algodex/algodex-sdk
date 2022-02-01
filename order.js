const algodex = require('./algodex_api.js')
const Big = require('big.js');

    const convertToBaseUnits = (amount, decimals = 6) => {
        const multiplier = new Big(10).pow(decimals)
        const wholeUnits = new Big(amount).round(decimals)
        return wholeUnits.times(multiplier).toNumber()
    }
    const convertToAsaUnits = (toConvert, decimals) => {
            if (!toConvert) {
                return 0
            }
            const multiplier = new Big(10).pow(6 - decimals)
            const algoUnits = new Big(toConvert)
            return algoUnits.times(multiplier).toNumber()
            }




// const AlgodClient = new algodex.initAlgodClient(algodex_environment)

const OrderService = {
  placeOrder: (AlgodClient, order, orderBook) => {

      debugger


   
    console.log('OrderService.placeOrder', { order })
    const assetId = order.asset.id
    const address = order.address
    const minimumAmount = 0
    // const algodex_environment = 'public_test'
    // const AlgodClient = new algodex.initAlgodClient(algodex_environment)

    const asaAmount = convertToBaseUnits(order.amount, order.asset.decimals)
    const algoAmount = convertToBaseUnits(order.total)

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
        return algodex.placeAlgosToBuyASAOrderIntoOrderbook(
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
        return algodex.placeASAToSellASAOrderIntoOrderbook(
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
      return algodex.executeOrderAsTaker(
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
      return algodex.executeMarketOrder( //First issue is figuring out the organization. Order.js on react uses the methods in index. Talk to Alex about the best way to handle this as there is nuance in the 
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

    return algodex.executeOrderAsMakerAndTaker(
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
  closeOrder: async (escrowAccountAddr, creatorAddr, orderBookEntry, version) => {
    return await algodex.closeOrderFromOrderBookEntry(
      AlgodClient,
      escrowAccountAddr,
      creatorAddr,
      orderBookEntry,
      version
    )
  }
}

module.exports = OrderService;
