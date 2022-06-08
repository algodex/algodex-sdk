/**
 * Singleton instance of the MyAlgoConnect Interface
 */
let connector;

/**
 * @typedef import('@randlabs/myalgo-connect').MyAlgoConnect
 */

/**
 * Makes a MyAlgoConnect interface
 *
 * @return {MyAlgoConnect}
 * @see https://connect.myalgo.com/docs/getting-started/quickstart
 * @memberOf wallet
 */
function makeConnector() {
  if (typeof window !== 'undefined') {
    const MyAlgoConnect = require('@randlabs/myalgo-connect');
    if (typeof connector === 'undefined') {
      MyAlgoConnect.prototype.sign = require('../signers/MyAlgoConnect');
      connector = new MyAlgoConnect();
      connector.connected = false;
    }
  } else {
    throw new Error('Wallet is not supported!!!');
  }
  return connector;
}

module.exports = makeConnector();
