
const {
  dumpVar,
} = require('../../functions/base');
const logger = require('../../logger');

const getStructuredTakerTxns = require('./getStructuredTakerTxns');
const composeTakerTxnsWithMaker = require('./withMakerTxns');
const getTakerOrderInformation = require('./getTakerOrderInformation');


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

	// TODO: Now that Standard Object is finalized use the same names as object whenever and pass object whenever possible.
  const includeMaker = compileObj.execution !== 'taker' ? true : false;
  const isSellingASA = compileObj.type === 'sell' ? true : false;
  const orderObj = {
    isSellingASA: isSellingASA,
    assetId: compileObj.asset.id,
    userWalletAddr: compileObj.address,
    limitPrice: compileObj.price, // Example: no need for limitPrice just use price. Fix and correct everything downstream
    orderAssetAmount: compileObj.contract.amount,
    orderAlgoAmount: compileObj.contract.total,
    allOrderBookOrders: compileObj.asset.orderbook,
  };

  let {queuedOrders, takerOrderBalance} = await getTakerOrderInformation(orderObj);

  compileObj.skipASAOptIn = takerOrderBalance.takerIsOptedIn;

  takerOrderBalance.algodClient = compileObj.client;

  compileObj.params = await compileObj.client.getTransactionParams().do();

  logger.debug('initial taker orderbalance: ', dumpVar(takerOrderBalance));


  if (queuedOrders == null && !includeMaker) {
    logger.debug('null queued orders, returning early');
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
    return await composeTakerTxnsWithMaker({...compileObj, execution:"maker"}, takerOrderBalance, takerTransObject.currentOrderValues.lastExecutedPrice, isSellingASA);
		// TODO: Talk to michael/ at least inform him that you need to mutate execution to maker in "both" mode if we want to use "makePlaceAssetTxns".
  }
}

module.exports = structure;


