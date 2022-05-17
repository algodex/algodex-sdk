const algosdk = require('algosdk');
const withCloseAlgoOrderTxns = require('../txns/close/withCloseAlgoOrderTxns');
const withCloseAssetOrderTxns = require('../txns/close/withCloseAssetOrderTxns');
const withExecuteAlgoOrderTxns = require('../txns/buy/withExecuteAlgoOrderTxns');
const withExecuteAssetOrderTxns = require('../txns/sell/withExecuteAssetOrderTxns');
const withPlaceAlgoOrderTxns = require('../txns/buy/withPlaceAlgoOrderTxns');
const withPlaceAssetOrderTxns = require('../txns/sell/withPlaceAssetOrderTxns');
const withTakerTxns = require('../txns/withTakerTxns');
const withMakerTakerTxns = require('./withMakerTakerTxnsNew');
const getTakerTxns = require('./getTakerTxns');
const makePlaceAlgoOrderTxns = require('../txns/buy/makePlaceAlgoTxns');
const compile = require('../compile/compile');


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
      _order = await withTakerTxns(api, order);
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
      _order = withMakerTakerTxns(api, order);
      break;

    default:
      throw new TypeError('execution property must be one of the following: maker, taker, cancel, both');
  }

  return _order;
}


module.exports = structure;
