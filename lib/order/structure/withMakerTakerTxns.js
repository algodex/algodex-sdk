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


  const orderWithTakerTxns = await withCutTakerTxns(await withTakerOrderInformation(order));
  return await withMakerTxns({...orderWithTakerTxns, execution: 'maker'});
}

module.exports = withMakerTakerTxns;


