
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
async function 
structure(
    order,
) {

	const _includeMaker = order.execution !== 'taker'
	const _isSellingAsset = order.type === 'sell'
  // let {queuedOrders, takerOrderBalance} = await getTakerOrderInformation(order);
	order = await withTakerOrderInformation(order)

  logger.debug('initial taker orderbalance: ', dumpVar(order.takerOrderBalance));

  if (order.asset.queuedOrders === null && !_includeMaker) {
    logger.debug('null queued orders, returning early');
    return;
  }
  if (order.asset.queuedOrders === null) {
    order.asset.queuedOrders = [];
  }

	const orderWithTakerTxns = await getStructuredTakerTxns(order) 

	// NOTE::** takerTransObjec now lives in contract takerOrderBalance property. AllTransList is in contract property

  if (orderWithTakerTxns === undefined) { //taker loop ended early without returning object so use original order Object for maker
    return await composeTakerTxnsWithMaker({...order, execution: 'maker'}, order.takerOrderBalance, order.price, _isSellingAsset);
  }
  // order.takerTransObject = takerTransObject;

  if (!_includeMaker) { //if it is taker only then just return the taker step 
    return orderWithTakerTxns;
  } else { //if it is both execution then add maker txns
    return await composeTakerTxnsWithMaker({...orderWithTakerTxns, execution: 'maker'},);
    // TODO: Talk to michael/ at least inform him that you need to mutate execution to maker in "both" mode if we want to use "makePlaceAssetTxns".
  }
}

module.exports = structure;


