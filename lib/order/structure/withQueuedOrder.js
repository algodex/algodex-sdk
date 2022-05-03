/**
 * ## ✉ composeQueuedOrderWithTakerInfo
 *
 * @param {Object} compileObj Compile object
 * @param {Object} takerOrderBalance Object Of Order And Wallet amounts
 * @param {Object} queuedOrder Object Of Order And Wallet amounts
 *
 * @return {Object} Object containing properly formatted composition of cutQueuedOrder and takerBalance for constructing
 * single transList
 * @memberOf module:order/structures
*/
function withQueuedOrder(order, queuedOrder) {
  const {takerOrderBalance} = order;
  if (takerOrderBalance.isExecuteASA) {
    const cutQueuedOrderComposedWithTakerInfo = {
      address: order.address,
      client: order.client,
      escrow: queuedOrder.escrowAddr,
      escrowCreator: queuedOrder.orderCreatorAddr,
      algoAmountSending: takerOrderBalance.algoTradeAmount,
      asaAmountReceiving: takerOrderBalance.escrowASATradeAmount,
      price: queuedOrder.price, // want to use the price of the escrow order and not the limit price
      asset: {
        id: order.asset.id,
      },
      appId: order.appId,
      shouldClose: queuedOrder.forceShouldClose,
      entry: queuedOrder.orderEntry,
      params: order.params,
      lsig: order.contract.lsig,
      takerIsOptedIn: takerOrderBalance.takerIsOptedIn,
      orderBookEscrowEntry: queuedOrder,
    };


    return {...order, cutTakerOrder: cutQueuedOrderComposedWithTakerInfo};
  } else {
    const cutQueuedOrderComposedWithTakerInfo = {
      address: order.address,
      escrow: queuedOrder.escrowAddr,
      client: order.client,
      escrowCreator: queuedOrder.orderCreatorAddr,
      algoAmountReceiving: takerOrderBalance.algoAmountReceiving,
      asaAmountSending: takerOrderBalance.asaAmountSending,
      price: queuedOrder.price, // want to use the price of the escrow order and not the limit price
      asset: {
        id: order.asset.id,
      },
      appId: order.appId,
      shouldClose: queuedOrder.forceShouldClose,
      entry: queuedOrder.orderEntry,
      params: order.params,
      lsig: order.contract.lsig,
      takerIsOptedIn: takerOrderBalance.takerIsOptedIn,
    };
    return {...order, cutTakerOrder: cutQueuedOrderComposedWithTakerInfo};
  }
}

module.exports = withQueuedOrder;
