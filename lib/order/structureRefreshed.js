
const {
  dumpVar,
} = require('../functions/base');


const getStructuredTakerTxns = require('./structures/withGetStructuredTakerTxns');
const composeTakerTxnsWithMaker = require('./structures/withComposeTakerTxnsWithMaker');
const getTakerOrderInformation = require('./structures/withGetTakerOrderInformation');


/**
	 *
	 * @param {*} algodClient
	 * @param {*} isSellingASA
	 * @param {*} assetId
	 * @param {*} userWalletAddr
	 * @param {*} limitPrice
	 * @param {*} orderAssetAmount
	 * @param {*} orderAlgoAmount
	 * @param {*} allOrderBookOrders
	 * @param {*} includeMaker
	 * @param {*} walletConnector
	 */
async function structure(
    compileObj,
) {
  const includeMaker = compileObj.execution !== 'taker' ? true : false;
  const isSellingASA = compileObj.type === 'sell' ? true : false;
  const orderObj = {
    isSellingASA: isSellingASA,
    assetId: compileObj.asset.id,
    userWalletAddr: compileObj.address,
    limitPrice: compileObj.contract.price,
    orderAssetAmount: compileObj.contract.amount,
    orderAlgoAmount: compileObj.contract.total,
    allOrderBookOrders: compileObj.asset.orderbook,
  };

  let {queuedOrders, takerOrderBalance} = await getTakerOrderInformation(orderObj);

  compileObj.skipASAOptIn = takerOrderBalance.takerIsOptedIn;

  takerOrderBalance.algodClient = compileObj.client;

  compileObj.params = await compileObj.client.getTransactionParams().do();

  console.debug('initial taker orderbalance: ', dumpVar(takerOrderBalance));


  if (queuedOrders == null && !includeMaker) {
    console.debug('null queued orders, returning early');
    return;
  }
  if (queuedOrders == null) {
    queuedOrders = [];
  }

  const takerTransObject = await getStructuredTakerTxns(takerOrderBalance, queuedOrders, isSellingASA, compileObj); // if ASA balance is 0 the


  if (takerTransObject === undefined) {
    return await composeTakerTxnsWithMaker(compileObj, takerOrderBalance, compileObj.price, isSellingASA);
  }
  compileObj.takerTransObject = takerTransObject;

  if (!includeMaker) {
    return takerTransObject.allTransList;
  } else {
    return await composeTakerTxnsWithMaker(compileObj, takerOrderBalance, takerTransObject.currentOrderValues.lastExecutedPrice, isSellingASA);
  }
}

module.exports = structure;


