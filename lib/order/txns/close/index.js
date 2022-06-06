/** @module txns/close */
const makeCloseAssetTxns = require('./makeCloseAssetTxns');
const withCloseAssetTxns = require('./withCloseAssetTxns');
const makeCloseAlgoTxns = require('./makeCloseAlgoTxns');
const withCloseAlgoTxns = require('./withCloseAlgoTxns');

module.exports = {
  makeCloseAssetTxns,
  withCloseAssetTxns: withCloseAssetTxns,
  makeCloseAlgoTxns,
  withCloseAlgoTxns: withCloseAlgoTxns,
};
