/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
