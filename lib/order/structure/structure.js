const algosdk = require('algosdk');
const withCloseAlgoOrderTxns = require('../txns/close/withCloseAlgoOrderTxns');
const withCloseAssetOrderTxns = require('../txns/close/withCloseAssetOrderTxns');
const withExecuteAlgoOrderTxns = require('../txns/buy/withExecuteAlgoOrderTxns');
const withExecuteAssetOrderTxns = require('../txns/sell/withExecuteAssetOrderTxns');
const withPlaceAlgoOrderTxns = require('../txns/buy/withPlaceAlgoOrderTxns');
const withPlaceAssetOrderTxns = require('../txns/sell/withPlaceAssetOrderTxns');
const withMakerTakerTxns = require('./withMakerTakerTxns');

/**
 * @param {Order} order The Order Object
 * @return {Promise<Array<OuterTxn>>}
 */
async function structure(order) {
  if (!(order?.client instanceof algosdk.Algodv2)) throw new TypeError('Must have valid algod client!!!');

  let _order;

  switch (order.execution) {
    // Maker can be compiled directly
    case 'maker':
      _order = order.type === 'buy' ?
        await withPlaceAlgoOrderTxns(order) :
        await withPlaceAssetOrderTxns(order);
      break;
    // Taker Buy order must have orderbook to execute from
    // case 'taker':
    //   _order = order.type === 'buy' ?
    //     withExecuteAssetOrderTxns(order) :
    //     withExecuteAlgoOrderTxns(order);
    //   break;
    // Execute Buy/Sell must have existing order
    case 'execution':
      _order = order.type === 'buy' ?
        await withExecuteAlgoOrderTxns(order) :
        await withExecuteAssetOrderTxns(order);
      break;
    // Close must have an existing order
    case 'close':
      _order = order.type === 'buy' ?
        await withCloseAlgoOrderTxns(order) :
        await withCloseAssetOrderTxns(order);
      break;
    // Automatically determine order matching
    case 'both':
      _order = await withMakerTakerTxns(order);
      break;

    default:
      throw new TypeError('execution property must be one of the following: maker, taker, cancel, both');
  }

  return _order;
}


module.exports = structure;
