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
      escrowCreator: queuedOrder.orderCreatorAddr,
      algoAmountSending: takerOrderBalance.algoTradeAmount,
      asaAmountReceiving: takerOrderBalance.escrowASATradeAmount,
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
      orderBookEscrowEntry: queuedOrder,
    };

    // if(takerOrderBalance.closeOutFromASA) {
    // 	cutQueuedOrderComposedWithTakerInfo['s']
    // }
    return cutQueuedOrderComposedWithTakerInfo;
  } else {
    const cutQueuedOrderComposedWithTakerInfo = {
      address: compileObj.address,
      escrow: queuedOrder.escrowAddr,
      escrowCreator: queuedOrder.orderCreatorAddr,
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
