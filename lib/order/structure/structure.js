const algosdk = require('algosdk');
const withCloseAlgoOrderTxns = require('../txns/close/withCloseAlgoOrderTxns');
const withCloseAssetOrderTxns = require('../txns/close/withCloseAssetOrderTxns');
const withExecuteAlgoOrderTxns = require('../txns/buy/withExecuteAlgoOrderTxns');
const withExecuteAssetOrderTxns = require('../txns/sell/withExecuteAssetOrderTxns');
const withPlaceAlgoOrderTxns = require('../txns/buy/withPlaceAlgoOrderTxns');
const withPlaceAssetOrderTxns = require('../txns/sell/withPlaceAssetOrderTxns');
const withMakerTakerTxns = require('./withMakerTakerTxns');
const getTakerTxns = require('./getTakerTxns');
const makePlaceAlgoOrderTxns = require('../txns/buy/makePlaceAlgoTxns');


/**
 * @param {Order} order The Order Object
 * @return {Promise<Array<OuterTxn>>}
 */
async function structure(api, order) {
  if (!(order?.client instanceof algosdk.Algodv2)) throw new TypeError('Must have valid algod client!!!');

  let _order;

  // ToDo: Instanceof check the api to determine how to handle missing order information. Throw error || fetch if api is type Algodex

  switch (order.execution) {
    case 'maker':
      _order = order.type === 'buy' ?
                withPlaceAlgoOrderTxns(order) :
                withPlaceAssetOrderTxns(order);
      break;

    case 'taker':

      // This is a rough but working version of takerTxns. Should work for both Buy and Sell and SplitOrder Buys. MakerTxns aren't working.
      // I imagine the logic for this will move locations but this is the way I'm envisioning it.
      const _takerOrder = await getTakerTxns(api, order);

      if (_takerOrder?.takerOrderBalance?.algoBalance > 0) { // not enough takers so using remainder for maker
        const takerTxns = _takerOrder.takerOrderBalance.allTransList;
        const {groupNum, txOrderNum} = _takerOrder.takerOrderBalance.currentOrderValues;
        const leftOverMakerTxns = await makePlaceAlgoOrderTxns({
          ...order,
          execution: 'maker',
          appId: 22045503, // Note: Test order for buy has ASA appID, need to switch to AlgoAppId for makers
          contract: {
            ...order.contract, total: _takerOrder.takerOrderBalance.algoBalance, // same price as user specified just with leftOverAmount from takerSide
          },
        });
        const groupedMakerTxns = leftOverMakerTxns.map((txn, i) => {
          return {...txn, groupNum: groupNum, txOrderNum: i + txOrderNum};
        });
        _order = {
          ...order, // original order object with new txns in contract
          contract: {
            ...order.contract,
            txns: takerTxns.concat(groupedMakerTxns),
          },
        };
      } else {
        _order = {
          ...order,
          contract: {
            ...order.contract,
            txns: _takerOrder,
          },
        };
      }


      break;

    case 'execute':
      _order = order.type === 'buy' ?
                withExecuteAssetOrderTxns(order) :
                withExecuteAlgoOrderTxns(order);
      break;

    case 'close':
      _order = order.type === 'buy' ?
                withCloseAlgoOrderTxns(order) :
                withCloseAssetOrderTxns(order);
      break;

    case 'both':
      _order = withMakerTakerTxns(order);
      break;

    default:
      throw new TypeError('execution property must be one of the following: maker, taker, cancel, both');
  }

  return _order;
}


module.exports = structure;
