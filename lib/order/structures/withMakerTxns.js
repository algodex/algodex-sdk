const logger = require('../../logger');
const {
  getPlaceASAToSellASAOrderIntoOrderbook,
  getPlaceAlgosToBuyASAOrderIntoOrderbook,
  getNumeratorAndDenominatorFromPrice,
} = require('../../functions/base');
const compile = require('../compile');

const withPlaceAlgoOrderTxns = require('./withPlaceAlgoOrderTxns');
const withPlaceAssetOrderTxns = require('./withPlaceAssetOrderTxns');

/**
 * ## ✉ withComposeTakerTxnsWithMaker
 * Accepts takerLeg of all translist and determines associated maker Transactions
 *
 * @param {Object} takerOrderBalance takerOrderBalance
 * @param {Array} queueOrders Array of queuedOrder objects
 * @param {Boolean} isSellingASA
 *
 * @return {Object} An object with array of taker transactions which as a whole represents the taker side .
 * @memberOf module:order/structures
 */
async function withComposeTakerTxnsWithMaker(compileObj, takerOrderBalance, limitPrice, isSellingASA) {
  const noTakerTransObject = {
    allTransList: [],
    currentOrderValues: {
      groupNum: 0,
      txOrderNum: 0,
    },
  };

  const {allTransList, currentOrderValues} = compileObj.takerTransObject !== undefined ? compileObj.takerTransObject : noTakerTransObject;
  let {lastExecutedPrice, groupNum, txOrderNum} = currentOrderValues;
  let makerTxns;


  // const numAndDenom = lastExecutedPrice !== -1 ?
  // 		getNumeratorAndDenominatorFromPrice(lastExecutedPrice) :
  // 		getNumeratorAndDenominatorFromPrice(limitPrice);
  // one complication is that potential cut n and d are not included in the takerOrderBalance logic, need to brainstorm
  const leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
  const leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
  logger.debug('includeMaker is true');
  if (isSellingASA && leftoverASABalance > 0) {
    logger.debug('leftover ASA balance is: ' + leftoverASABalance);

    makerTxns = await withPlaceAssetOrderTxns(compileObj);

    // makerTxns = await getPlaceASAToSellASAOrderIntoOrderbook(
    // 	compileObj.algodClient,
    // 	takerOrderBalance.takerAddr,
    // 	compileObj.contract.n,
    // 	compileObj.contract.d,
    // 	0,
    // 	takerOrderBalance.assetId,
    // 	leftoverASABalance,
    // 	false,
    // );
  } else if (!isSellingASA && leftoverAlgoBalance > 0) {
    logger.debug('leftover Algo balance is: ' + leftoverASABalance);
    makerTxns = await withPlaceAlgoOrderTxns(compileObj);

    // makerTxns = await getPlaceAlgosToBuyASAOrderIntoOrderbook(
    //   compileObj.algodClient,
    //   takerOrderBalance.takerAddr,
    //   compileObj.contract.n,
    //   compileObj.contract.d,
    //   0,
    //   takerOrderBalance.assetId,
    //   leftoverAlgoBalance,
    //   false,
    // );
  }


  if (makerTxns != null) { // attaches the groupNumber and txOrderNum to the returnObject of withPlace
    for (let k = 0; k < makerTxns.contract.txns.length; k++) {
      const trans = makerTxns.contract.txns[k];
      trans['txOrderNum'] = txOrderNum;
      trans['groupNum'] = groupNum;
      txOrderNum++;
      allTransList.push(trans);


      // we are leaving the signing of lsigs to walletClients
      //   if (typeof (trans.lsig) !== 'undefined') {
      // if (!walletConnector || !walletConnector.connector.connected) {
      // 	  const signedTxn = algosdk.signLogicSigTransactionObject(
      // 		  trans.unsignedTxn,
      // 		  trans.lsig,
      // 	  );
      // 	  trans.signedTxn = signedTxn.blob;
      // }
      //   }
    }
    groupNum++;
  }
  if (allTransList == null || allTransList.length == 0) {
    logger.debug('no transactions, returning early');
  }

  compileObj.contract.txns = allTransList; // we can do this because the only thing changed in the withMethod is an added txns field
  return compileObj;
}

module.exports = withComposeTakerTxnsWithMaker;
