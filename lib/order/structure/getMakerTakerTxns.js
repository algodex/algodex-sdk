const getTakerTxns = require('./getTakerTxns');
const makePlaceAlgoOrderTxns = require('../txns/buy/makePlaceAlgoTxns');
const compile = require('../compile/compile');

async function getMakerTakerTxns(api, order) {
  const _takerOrder = await getTakerTxns(api, order);
  const takerTxns = _takerOrder?.takerOrderBalance?.allTransList;
  if (typeof takerTxns !== 'undefined' || _takerOrder?.takerOrderBalance?.algoBalance > 0) { // not enough takers so using remainder for maker
    const {groupNum, txOrderNum} = _takerOrder.takerOrderBalance.currentOrderValues;

    const leftOverMakerOrder = {
      ...order,
      execution: 'maker',
      appId: 22045503, // Note: Test order for buy has ASA appID, need to switch to AlgoAppId for makers
      total: _takerOrder.takerOrderBalance.algoBalance,
    };

    delete leftOverMakerOrder.contract;
    const compiledLeftOverOrder = await compile(leftOverMakerOrder);
    const leftOverMakerTxns = await makePlaceAlgoOrderTxns(compiledLeftOverOrder);
    const groupedMakerTxns = leftOverMakerTxns.map((txn, i) => {
      return {...txn, groupNum: groupNum, txOrderNum: i + txOrderNum};
    });

    return takerTxns.concat(groupedMakerTxns);
  } else {
    // ToDo: If taker TXNS isn't undefined but an empty array then we still need to placeMakerTxn
    // Currently the logic assumes that takerTxns is either undefined or populated with TXNS.
    // But the edge case of somethign that should be a maker getting passed into "both" breaks
    // simple fix for tomorrow

    return takerTxns;
  }
}


module.exports = getMakerTakerTxns;
