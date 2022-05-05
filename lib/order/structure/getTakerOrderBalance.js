// TODO: Remove base functions
const {
  getQueuedTakerOrders,
  getAccountInfo,
  dumpVar,
} = require('../../functions/base');

const getMinBalance = require('../../wallet/getMinBalance');
const getOptedIn = require('../../wallet/getOptedIn');
const logger = require('../../logger');
const getWalletAlgoBalance = require('./getWalletAlgoBalance');
const getWalletAssetAmount = require('./getWalletAssetAmount');
const determineFinalOrderAndWalletAmounts = require('./withDetermineFinalOrderAndWalletAmounts');

/**
 * ## ✉ getTakerOrderInformation
 * generates the necesarry parameters associated with executing a type:Taker transaction
     *
     * @param {Object} orderObj
     *  @param {Object} takerAccountInfo
     * * @param {Number} takerMinBalance
     * @return {Object}

     */
async function getTakerOrderInformation(
    order, takerAccountInfo, takerMinBalance,
) {
  const {
    client,
    type,
    asset: {
      id: assetId,

    },
    address,
    price,
    contract: {
      amount: orderAssetAmount,
    }} = order;
  logger.debug('in getTakerOrderInformation');

  const _isSellingAsset = type === 'sell';


  const _walletAlgoAmount = getWalletAlgoBalance(takerAccountInfo, takerMinBalance);

  if (!_walletAlgoAmount) {
    logger.debug('not enough to trade!! returning early');
    return;
  }

  const _walletAssetAmount = getWalletAssetAmount(takerAccountInfo, assetId);

  const _takerIsOptedIn = await getOptedIn(client, address, assetId);
  // TODO: We should move optIn check to a higher level, talk to michael whether it should be attaches as prop on orderObject

  const _finalAmountsObj = {
    orderAssetAmount: orderAssetAmount,
    orderAlgoAmount: orderAssetAmount * order.price,
    walletAlgoAmount: _walletAlgoAmount,
    walletAssetAmount: _walletAssetAmount,
  };

  const {
    orderAlgoBalance: _orderAlgoBalance,
    orderAssetBalance: _orderAssetBalance,
  } = determineFinalOrderAndWalletAmounts(_finalAmountsObj, _isSellingAsset);

  const takerOrderBalance = {
    'asaBalance': _orderAssetBalance,
    'algoBalance': _orderAlgoBalance,
    'walletAlgoBalance': _walletAlgoAmount,
    'walletASABalance': _walletAssetAmount,
    'limitPrice': price,
    'takerAddr': address,
    'walletMinBalance': takerMinBalance,
    'takerIsOptedIn': _takerIsOptedIn,
    'asset-id': assetId,
    // adding assetId to takerOrderBalance so composeWithMaker has access to assetId when used in placeAlgo/Asa
  };

  logger.debug('initial taker orderbalance: ', dumpVar(takerOrderBalance));

  return takerOrderBalance;
}

module.exports = getTakerOrderInformation;


