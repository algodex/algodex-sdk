const getTakerTxns = require('./getTakerTxns');
const makePlaceAlgoOrderTxns = require('../txns/buy/makePlaceAlgoTxns');
const makePlaceAssetOrderTxns = require('../txns/sell/makeExecuteAssetTxns');
const compile = require('../compile/compile');

//  Note: Execution works for Buy Side when no taker orders exist but still cannot get taker with remaining maker working.

async function getMakerTakerTxns(api, order) {
  let outerTxns;
  let compiledAsMaker;
  const _takerOrder = await getTakerTxns(api, order);
  const takerTxns = _takerOrder?.takerOrderBalance?.allTransList;

  const potentialScenarios = ['undefinedTaker', 'emptyTaker', 'makerTaker'];

  const scenario = typeof takerTxns === 'undefined' ?
        potentialScenarios[0] :
        takerTxns.length === 0 ?
            potentialScenarios[1] :
            takerTxns.length > 0 ?
                potentialScenarios[2] : 'None Applicable';


  switch (scenario) {
    case 'undefinedTaker':
      delete order.contract; // Ask Michael whether or not he prefers to copy order before deleting contract
      compiledAsMaker = await compile({...order, execution: 'maker', appId: 22045503}); // forBuyOrders


      outerTxns = order.type === 'buy' ?
                await makePlaceAlgoOrderTxns(compiledAsMaker) :
                await makePlaceAssetOrderTxns(compiledAsMaker);

      // delete outerTxns[0].unsignedTxn?.appArgs
      // delete outerTxns[0].unsignedTxn?.name

      break;

    case 'emptyTaker':
      delete order.contract;
      compiledAsMaker = await compile({
        ...order,
        execution: 'maker',
        appId: 22045503,
      });
      outerTxns = order.type === 'buy' ?
                await makePlaceAlgoOrderTxns({...compiledAsMaker}) :
                await makePlaceAssetOrderTxns(compiledAsMaker);

      // if TXN has extra properties it will break when sending raw transaction
      delete outerTxns[0].unsignedTxn?.appArgs;
      delete outerTxns[0].unsignedTxn?.name;


      break;

    case 'makerTaker':


      // TODO: Extend to sell side
      const {groupNum, txOrderNum} = _takerOrder.takerOrderBalance.currentOrderValues;

      const leftOverOrder = {
        ...order,
        execution: 'maker',
        appId: 22045503, // Note: Test order for buy has ASA appID, need to switch to AlgoAppId for maker
      };
      delete leftOverOrder.contract;
      compiledAsMaker = await compile(leftOverOrder);
      const leftOverMakerTxns = await makePlaceAlgoOrderTxns({
        ...compiledAsMaker,
        contract: {
          ...compiledAsMaker.contract,
          total: _takerOrder.takerOrderBalance.algoBalance, // add the remaining total after compiling since no need for decimal formatting
        },
      });
      const groupedMakerTxns = leftOverMakerTxns.map((txn, i) => {
        return {...txn, groupNum: groupNum, txOrderNum: i + txOrderNum};
      });

      outerTxns = takerTxns.concat(groupedMakerTxns);
      break;
    default:
      throw new TypeError('improperly formatted order.');
  }


  return outerTxns;
}


module.exports = getMakerTakerTxns;
