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
  if (typeof window !== 'undefined') {
    console.log('Browser');
    if (typeof connector === 'undefined') {
      const WalletConnect = require('@walletconnect/client').default;
      WalletConnect.prototype.sign = require('../signers/WalletConnect');
      connector = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org',
        qrcodeModal: require('algorand-walletconnect-qrcode-modal'),
      });
    }
  } else {
    console.log('Node');
    throw new Error('Wallet is not supported!!!');
  }
  return connector;
}

module.exports = makeConnector();
