/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const withUnits = require('../../compile/withUnits');
const getMinBalance = require('../../../wallet/getMinBalance');
const getOptedIn = require('../../../wallet/getOptedIn');
const logger = require('../../../logger');
const getWalletAlgoBalance = require('../../../wallet/getWalletAlgoBalance');
const getWalletAssetAmount = require('../../../wallet/getWalletAssetAmount');


/**
 * ## ✉ withDetermineFinaleOrderAndWalletAmounts
 * Validates and returns assetWalletAmount associated
 * with an account
 *
 * @param {Object} walletAndOrderAmountObj Object Of Order And Wallet amounts
 * @param {Boolean} isSellingASA determines whether buy or sell
 * @return {Object} Object containing final algo and asset amounts
 * @ignore
 */
function determineFinalOrderAmounts(walletAndOrderAmountObj, isSellingASA) {
  let {orderAssetAmount, orderAlgoAmount, walletAlgoAmount, walletAssetAmount} = walletAndOrderAmountObj;
  orderAssetAmount = Math.max(1, orderAssetAmount);
  orderAlgoAmount = Math.max(1, orderAlgoAmount);

  if (isSellingASA) {
    // we are selling an ASA so check wallet balance
    return {
      orderAlgoBalance: walletAlgoAmount,
      orderAssetBalance: Math.min(orderAssetAmount, walletAssetAmount),
    };
  } else {
    // wallet ASA balance doesn't matter since we are selling algos
    return {
      orderAlgoBalance: Math.min(orderAlgoAmount, walletAlgoAmount),
      orderAssetBalance: walletAssetAmount,
    };
  }
}
/**
 * @typedef {Object} TakerInformation
 * @property {number} asaBalance
 * @property {number} algoBalance
 * @property {number} walletAlgoBalance
 * @property {number} walletASABalance
 * @property {number} limitPrice
 * @property {string} takerAddr
 * @property {number} walletMinBalance
 * @property {boolean} takerIsOptedIn
 * @property {number} asset-id
 * @ignore
 */

/**
 * ## ✉ getTakerOrderInformation
 * generates the necesarry parameters associated with executing a type:Taker transaction
 * @param {Order} order The User's Order
 * @param {Array<Order>} queuedOrders A list of Executable Orders
 * @return {Promise<TakerInformation>}
 * @ignore
 */
async function getTakerOrderInformation(
    order, queuedOrders,
) {
  const _order = withUnits(order);
  logger.debug({order}, 'withTakerOrderInformation');
  const _isSellingAsset = order.type === 'sell';

  // Introspection
  if (typeof queuedOrders === 'undefined' || !Array.isArray(queuedOrders)) {
    throw new TypeError('Must have valid orders!');
  }

  /**
     * Taker Account Information
     * @type {Account}
     * @private
     */
  const _takerAccountInfo = await order.indexer.lookupAccountByID(order.address).do();
  /**
     * Taker Minimum Balance
     * @type {number}
     * @private
     */
  const _takerMinBalance = getMinBalance(
      _takerAccountInfo.account,
  );
  logger.debug({min_bal: _takerMinBalance});

  // let walletAssetAmount = 0;

  const _walletAlgoAmount = getWalletAlgoBalance(_takerAccountInfo.account, _takerMinBalance);

  if (!_walletAlgoAmount) {
    logger.debug('not enough to trade!! returning early');
    return;
  }

  const _walletAssetAmount = getWalletAssetAmount(_takerAccountInfo.account, order.asset.id);


  const _takerIsOptedIn = await getOptedIn(order.indexer, _takerAccountInfo.account, order.asset.id);

  const _finalAmountsObj = {
    orderAssetAmount: _order.contract.amount,
    orderAlgoAmount: _order.contract.total,
    walletAlgoAmount: _walletAlgoAmount,
    walletAssetAmount: _walletAssetAmount,
  };

  const {
    orderAlgoBalance: _orderAlgoBalance,
    orderAssetBalance: _orderAssetBalance,
  } = determineFinalOrderAmounts(_finalAmountsObj, _isSellingAsset);

  return {
    'asaBalance': _orderAssetBalance,
    'algoBalance': _orderAlgoBalance,
    'walletAlgoBalance': _walletAlgoAmount,
    'walletASABalance': _walletAssetAmount,
    'limitPrice': order.price,
    'takerAddr': order.address,
    'walletMinBalance': _takerMinBalance,
    'takerIsOptedIn': _takerIsOptedIn,
    'client': order?.client, // TODO: See if Michael is okay with addition of appId and client
    'appId': queuedOrders[0]?.appId, // same type of appId we will be executing against
    // TODO: fix casing
    'asset-id': order.asset.id,
    // adding assetId to takerOrderBalance so composeWithMaker has access to assetId when used in placeAlgo/Asa
  };
}

module.exports = getTakerOrderInformation;


if (process.env.NODE_ENV === 'test') {
  module.exports.determineFinalOrderAmounts = determineFinalOrderAmounts;
}
