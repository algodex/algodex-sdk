const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const withCutTakerTxns = require('./withCutTakerTxns');
const withMakerTxns = require('./withMakerTxns');
const withTakerOrderInformation = require('./withTakerOrderInformation');


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
async function withMakerTakerTxns(order) {
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  if (typeof order.contract !== 'undefined' && typeof order.contract.entry !== 'string') {
    throw new TypeError('Order must have a valid contract state with an entry!');
  }


  const _includeMaker = order.execution !== 'taker';

  const orderWithTakerTxns = await withCutTakerTxns(await withTakerOrderInformation(order));
  if (orderWithTakerTxns === undefined) { // taker loop ended early without returning object so use original order Object for maker
    return await withMakerTxns({...order, execution: 'maker'});
  }

  if (!_includeMaker) { // if it is taker only then just return the taker step
    return orderWithTakerTxns;
  } else { // if it is both execution then add maker txns
    return await withMakerTxns({...orderWithTakerTxns, execution: 'maker'});
    // TODO: Talk to michael/ at least inform him that you need to mutate execution to maker in "both" mode if we want to use "makePlaceAssetTxns".
  }
}

module.exports = withMakerTakerTxns;


