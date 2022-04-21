
const {
  getQueuedTakerOrders,
  getAccountInfo,
  getMinWalletBalance,
} = require('../../functions/base');

const getWalletAlgoBalance = require('./withGetWalletAlgoBalance');
const getWalletAssetAmount = require('./withGetWalletAssetAmount');
const determineFinalOrderAndWalletAmounts = require('./withDetermineFinalOrderAndWalletAmounts');

/**
 * ## ✉ getTakerOrderInformation
 * generates the necesarry parameters associated with executing a type:Taker transaction
	 *
	 * @param {Object} orderObj
	 * @return {Object}

	 */
async function getTakerOrderInformation(
    orderObj,
) {
  const {
    isSellingASA,
    assetId,
    userWalletAddr,
    limitPrice,
    orderAssetAmount,
    orderAlgoAmount,
    allOrderBookOrders} = orderObj;
  console.debug('in getTakerOrderInformation');

  const queuedOrders = getQueuedTakerOrders(
      userWalletAddr,
      isSellingASA,
      allOrderBookOrders,
  );

  // getMinWalletBalance calls getAccountInfo internally when flagged true,
  // why are we doing this twice? by flagging false we get the desired output
  // but and save on an async request
  const execAccountInfo = await getAccountInfo(userWalletAddr);
  // const alreadyOptedIn = false;

  const takerMinBalance = await getMinWalletBalance(
      execAccountInfo,
      false, // cuts down on the async request
  );

  console.debug({min_bal: takerMinBalance});

  // let walletAssetAmount = 0;

  const walletAlgoAmount= getWalletAlgoBalance(execAccountInfo, takerMinBalance);

  if (!walletAlgoAmount) {
    console.debug('not enough to trade!! returning early');
    return;
  }

  const walletAssetAmount = getWalletAssetAmount(execAccountInfo, assetId);

  const getTakerOptedIn = (accountInfo, assetId) => {
    let takerAlreadyOptedIntoASA = false;
    if (accountInfo != null && accountInfo['assets'] != null &&
      accountInfo['assets'].length > 0) {
      for (let i = 0; i < accountInfo['assets'].length; i++) {
        if (accountInfo['assets'][i]['asset-id'] === assetId) {
          takerAlreadyOptedIntoASA = true;
          break;
        }
      }
    }
    return takerAlreadyOptedIntoASA;
  };
  // Can we safely assume that if the walletAssetAmount is greater than 0 that the account is opted in
  const takerIsOptedIn = getTakerOptedIn(execAccountInfo, assetId);

  const finalAmountsObj = {
    orderAssetAmount: orderAssetAmount,
    orderAlgoAmount: orderAlgoAmount,
    walletAlgoAmount: walletAlgoAmount,
    walletAssetAmount: walletAssetAmount,
  };

  const {
    orderAlgoBalance,
    orderAssetBalance,
  } = determineFinalOrderAndWalletAmounts(finalAmountsObj, isSellingASA);

  const takerOrderBalance = {
    'asaBalance': orderAssetBalance,
    'algoBalance': orderAlgoBalance,
    'walletAlgoBalance': walletAlgoAmount,
    'walletASABalance': walletAssetAmount,
    'limitPrice': limitPrice,
    'takerAddr': userWalletAddr,
    'walletMinBalance': takerMinBalance,
    'takerIsOptedIn': takerIsOptedIn,
    'asset-id': assetId,
    // adding assetId to takerOrderBalance so composeWithMaker has access to assetId when used in placeAlgo/Asa
  };

  return {takerOrderBalance, queuedOrders};
}

module.exports = getTakerOrderInformation;


