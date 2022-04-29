
const {
  getQueuedTakerOrders,
  getAccountInfo,
} = require('../../functions/base');
const getMinBalance = require('../../wallet/getMinBalance')
const getOptedIn = require('../../wallet/getOptedIn')
const logger = require('../../logger');
const getWalletAlgoBalance = require('./getWalletAlgoBalance');
const getWalletAssetAmount = require('./getWalletAssetAmount');
const determineFinalOrderAndWalletAmounts = require('./withDetermineFinalOrderAndWalletAmounts');

/**
 * ## ✉ getTakerOrderInformation
 * generates the necesarry parameters associated with executing a type:Taker transaction
	 *
	 * @param {Object} orderObj
	 * @return {Object}

	 */
async function withTakerOrderInformation(
    order,
) {
  const {
		client,
    execution,
    asset: {
			id: assetId,
			orderbook
		},
    address,
    price,
    contract:{
			orderAssetAmount,
    	orderAlgoAmount},} = order;
  logger.debug('in getTakerOrderInformation');
	
	const _isSellingAsset = execution === 'sell'

  const _queuedOrders = getQueuedTakerOrders(
      address,
      _isSellingAsset,
      orderbook,
  );

	

  const _takerAccountInfo = await getAccountInfo(address);
  // const alreadyOptedIn = false;

  const _takerMinBalance = await getMinBalance(
      _takerAccountInfo,
  );

  logger.debug({min_bal: _takerMinBalance});

  // let walletAssetAmount = 0;

  const _walletAlgoAmount= getWalletAlgoBalance(_takerAccountInfo, _takerMinBalance);

  if (!_walletAlgoAmount) {
    logger.debug('not enough to trade!! returning early');
    return;
  }

  const _walletAssetAmount = getWalletAssetAmount(_takerAccountInfo, assetId);


  const _takerIsOptedIn = getOptedIn(client, address, assetId);

  const _finalAmountsObj = {
    orderAssetAmount: orderAssetAmount,
    orderAlgoAmount: orderAlgoAmount,
    walletAlgoAmount: _walletAlgoAmount,
    walletAssetAmount: _walletAssetAmount,
  };

  const {
    _orderAlgoBalance,
    _orderAssetBalance,
  } = determineFinalOrderAndWalletAmounts(_finalAmountsObj, _isSellingAsset);

  const takerOrderBalance = {
    'asaBalance': _orderAssetBalance,
    'algoBalance': _orderAlgoBalance,
    'walletAlgoBalance': _walletAlgoAmount,
    'walletASABalance': _walletAssetAmount,
    'limitPrice': price,
    'takerAddr': address,
    'walletMinBalance': _takerMinBalance,
    'takerIsOptedIn': _takerIsOptedIn,
    'asset-id': assetId,
    // adding assetId to takerOrderBalance so composeWithMaker has access to assetId when used in placeAlgo/Asa
  };

  return {...order, takerOrderBalance:takerOrderBalance, asset:{...order.asset, queuedOrders:_queuedOrders} }; //TODO: Talk to michael about overwriting asset.orderbook
}

module.exports = withTakerOrderInformation;


