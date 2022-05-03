/**
 * @module order/txns
 */
const makePlaceAlgoTxns = require('./makePlaceAlgoTxns');
const withPlaceAlgoOrderTxns = require('./withPlaceAlgoOrderTxns');
const makeExecuteAlgoTxns = require('./makeExecuteAlgoTxns');
const withExecuteAlgoOrderTxns = require('./withExecuteAlgoOrderTxns');
module.exports = {
  makePlaceAlgoTxns,
  withPlaceAlgoOrderTxns,
  makeExecuteAlgoTxns,
  withExecuteAlgoOrderTxns,
};
