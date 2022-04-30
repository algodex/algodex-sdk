
const {
  dumpVar,
} = require('../../functions/base');
const logger = require('../../logger');

const getStructuredTakerTxns = require('./getStructuredTakerTxns');
const composeTakerTxnsWithMaker = require('./withMakerTxns');
const withTakerOrderInformation = require('./getTakerOrderInformation');



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
    order,
) {

	const _includeMaker = order.execution !== 'taker'
	const _isSellingAsset = order.type === 'sell'
  // let {queuedOrders, takerOrderBalance} = await getTakerOrderInformation(order);
	order = await withTakerOrderInformation(order)

  // order.takerOptedIn = takerOrderBalance.takerIsOptedIn;

  // takerOrderBalance.algodClient = order.client;

  // order.params = await order.client.getTransactionParams().do();

  logger.debug('initial taker orderbalance: ', dumpVar(order.takerOrderBalance));


  if (order.asset.queuedOrders === null && !_includeMaker) {
    logger.debug('null queued orders, returning early');
    return;
  }
  if (order.asset.queuedOrders === null) {
    queuedOrders = [];
  }

  // const takerTransObject = await getStructuredTakerTxns(takerOrderBalance, queuedOrders, _isSellingAsset, order); // if ASA balance is 0 the

	order = await getStructuredTakerTxns(order)

	// NOTE::** takerTransObjec now lives in contract takerOrderBalance property. AllTransList is in contract property

  if (order.takerTransObject === undefined) {
    return await composeTakerTxnsWithMaker({...order, execution: 'maker'}, order.takerOrderBalance, order.price, _isSellingAsset);
  }
  order.takerTransObject = takerTransObject;

  if (!_includeMaker) {
    return takerTransObject.allTransList;
  } else {
    return await composeTakerTxnsWithMaker({...order, execution: 'maker'}, order.takerOrderBalance, takerTransObject.currentOrderValues.lastExecutedPrice, _isSellingAsset);
    // TODO: Talk to michael/ at least inform him that you need to mutate execution to maker in "both" mode if we want to use "makePlaceAssetTxns".
  }
}

module.exports = structure;


