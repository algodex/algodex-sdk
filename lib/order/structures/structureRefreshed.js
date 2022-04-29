
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
    order,
) {

	const _includeMaker = order.type !== 'taker'
	const _isSellingAsset = order.execution === 'sell'
  let {queuedOrders, takerOrderBalance} = await getTakerOrderInformation(order);

  order.skipASAOptIn = takerOrderBalance.takerIsOptedIn;

  takerOrderBalance.algodClient = order.client;

  order.params = await order.client.getTransactionParams().do();

  logger.debug('initial taker orderbalance: ', dumpVar(takerOrderBalance));


  if (queuedOrders == null && !_includeMaker) {
    logger.debug('null queued orders, returning early');
    return;
  }
  if (queuedOrders == null) {
    queuedOrders = [];
  }

  const takerTransObject = await getStructuredTakerTxns(takerOrderBalance, queuedOrders, order.execution === 'sell', order); // if ASA balance is 0 the


  if (takerTransObject === undefined) {
    return await composeTakerTxnsWithMaker(order, takerOrderBalance, order.price, order.execution === 'sell');
  }
  order.takerTransObject = takerTransObject;

  if (!_includeMaker) {
    return takerTransObject.allTransList;
  } else {
    return await composeTakerTxnsWithMaker({...order, execution: 'maker'}, takerOrderBalance, takerTransObject.currentOrderValues.lastExecutedPrice, order.execution === 'sell');
    // TODO: Talk to michael/ at least inform him that you need to mutate execution to maker in "both" mode if we want to use "makePlaceAssetTxns".
  }
}

module.exports = structure;


