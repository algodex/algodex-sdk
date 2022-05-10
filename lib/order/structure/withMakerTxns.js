const logger = require('../../logger');
const withPlaceAlgoOrderTxns = require('../txns/buy/withPlaceAlgoOrderTxns');
const withPlaceAssetOrderTxns = require('../txns/sell/withPlaceAssetOrderTxns');
const compile = require('../compile');

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
async function withMakerTxns(order) { // takerOrderBalance, limitPrice, isSellingASA
  const {takerOrderBalance} = order;

  const noTakerTransObject = {
    allTransList: [],
    currentOrderValues: {
      groupNum: 0,
      txOrderNum: 0,
    },
  };

  const _isSellingAsset = order.type === 'sell';


  let {
    allTransList,
    currentOrderValues: {
      groupNum,
      txOrderNum,
    },
  } = typeof takerOrderBalance.currentOrderValues !== 'undefined' ? takerOrderBalance : noTakerTransObject;

  // let {lastExecutedPrice, groupNum, txOrderNum} = currentOrderValues;
  let makerTxns;


  // const numAndDenom = lastExecutedPrice !== -1 ?
  // 		getNumeratorAndDenominatorFromPrice(lastExecutedPrice) :
  // 		getNumeratorAndDenominatorFromPrice(limitPrice);
  // one complication is that potential cut n and d are not included in the takerOrderBalance logic, need to brainstorm
  const _leftoverASABalance = Math.floor(takerOrderBalance['asaBalance']);
  const _leftoverAlgoBalance = Math.floor(takerOrderBalance['algoBalance']);
  logger.debug('includeMaker is true');
  const _order = {...order};
  if (_isSellingAsset && _leftoverASABalance > 0) {
    logger.debug('leftover ASA balance is: ' + _leftoverASABalance);
    delete _order.contract;
    makerTxns = await withPlaceAssetOrderTxns(await compile(_order));
  } else if (!_isSellingAsset && _leftoverAlgoBalance > 0) {
    logger.debug('leftover Algo balance is: ' + _leftoverASABalance);
    delete _order.contract;
    makerTxns = await withPlaceAlgoOrderTxns(await compile(_order));
  }


  if (makerTxns != null) { // attaches the groupNumber and txOrderNum to the returnObject of withPlace
    for (let k = 0; k < makerTxns.contract.txns.length; k++) {
      const trans = makerTxns.contract.txns[k];
      trans['txOrderNum'] = txOrderNum;
      trans['groupNum'] = groupNum;
      txOrderNum++;
      allTransList.push(trans);
    }
    groupNum++;
  }
  if (allTransList == null || allTransList.length === 0) {
    logger.debug('no transactions, returning early');
    throw new Error('Something went wrong!');
  }

  order.contract = {
    txns: allTransList,
  }; // we can do this because the only thing changed in the withMethod is an added txns field
  return order;
}

module.exports = withMakerTxns;
