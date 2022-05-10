const algosdk = require('algosdk');
const withCloseAlgoOrderTxns = require('../txns/close/withCloseAlgoOrderTxns');
const withCloseAssetOrderTxns = require('../txns/close/withCloseAssetOrderTxns');
const withExecuteAlgoOrderTxns = require('../txns/buy/withExecuteAlgoOrderTxns');
const withExecuteAssetOrderTxns = require('../txns/sell/withExecuteAssetOrderTxns');
const withPlaceAlgoOrderTxns = require('../txns/buy/withPlaceAlgoOrderTxns');
const withPlaceAssetOrderTxns = require('../txns/sell/withPlaceAssetOrderTxns');
const withMakerTakerTxns = require('./withMakerTakerTxns');
const AlgodError = require('../../error/AlgodError');

/**
 * @param {Order} order The Order Object
 * @return {Promise<Array<OuterTxn>>}
 */
async function structure(order) {
  if (!(order?.client instanceof algosdk.Algodv2)) throw new AlgodError('Must have valid algod client!!!');

  let _order;

  switch (order.execution) {
    case 'maker':
      _order = order.type === 'buy' ?
                withPlaceAlgoOrderTxns(order) :
                withPlaceAssetOrderTxns(order);
      break;

    case 'taker':
      _order = order.type === 'buy' ?
                withExecuteAlgoOrderTxns(order) :
                withExecuteAssetOrderTxns(order);
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
