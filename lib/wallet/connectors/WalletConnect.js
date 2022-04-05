const {isUndefined} = require('lodash/lang');

/**
 * Singleton instance of the WalletConnect Interface
 */
let connector;

/**
 * @typedef import('@walletconnect/types').IClient
 */

/**
 * Makes a WalletConnect interface
 *
 * @return {IClient}
 * @see https://developer.algorand.org/docs/get-details/walletconnect/
 */
function makeConnector() {
  if (isUndefined(connector)) {
    const WalletConnect = require('@walletconnect/client');
    WalletConnect.prototype.sign = require('../signers/WalletConnect');
    connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: require('algorand-walletconnect-qrcode-modal'),
    });
  }
  return connector;
}

module.exports = makeConnector();
