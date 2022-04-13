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
function composeQueuedOrderWithTakerInfo(compileObj, takerOrderBalance, queuedOrder) {
  if (takerOrderBalance.isExecuteASA) {
    const cutQueuedOrderComposedWithTakerInfo = {
      address: compileObj.address,
      escrow: queuedOrder.escrowAddr,
      algoAmountSending: takerOrderBalance.algoTradeAmount,
      asaAmountRecieving: takerOrderBalance.escrowASATradeAmount,
      price: queuedOrder.price, // want to use the price of the escrow order and not the limit price
      asset: {
        id: compileObj.asset.id,
      },
      appId: compileObj.appId,
      shouldClose: queuedOrder.forceShouldClose,
      entry: queuedOrder.orderEntry,
      params: compileObj.params,
      lsig: compileObj.contract.lsig,
      takerIsOptedIn: takerOrderBalance.takerIsOptedIn,
    };
    return cutQueuedOrderComposedWithTakerInfo;
  } else {
    const cutQueuedOrderComposedWithTakerInfo = {
      address: compileObj.address,
      escrow: queuedOrder.escrowAddr,
      algoAmountReceiving: takerOrderBalance.algoAmountReceiving,
      asaAmountSending: takerOrderBalance.asaAmountSending,
      price: queuedOrder.price, // want to use the price of the escrow order and not the limit price
      asset: {
        id: compileObj.asset.id,
      },
      appId: compileObj.appId,
      shouldClose: queuedOrder.forceShouldClose,
      entry: queuedOrder.orderEntry,
      params: compileObj.params,
      lsig: compileObj.contract.lsig,
      takerIsOptedIn: takerOrderBalance.takerIsOptedIn,
    };
    return cutQueuedOrderComposedWithTakerInfo;
  }
}

module.exports = composeQueuedOrderWithTakerInfo;
