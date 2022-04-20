let connector;
const algosdk = require('algosdk');

/**
 *
 * @return {algosdk}
 */
function makeConnector() {
  if (typeof connector === 'undefined') {
    algosdk.sign = require('../signers/AlgoSDK');
    connector = algosdk;
    connector.connected = false;
  }
  return connector;
}

module.exports = makeConnector();
