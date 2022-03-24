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
    connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: require('algorand-walletconnect-qrcode-modal'),
    });
    // Check if connection is already established
    if (!connector.connected) {
      throw new Error('Wallet not connected!!!');
    }
  }
  return connector;
}

module.exports = makeConnector();
