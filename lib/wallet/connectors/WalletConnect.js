/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const logger = require('../../logger');
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
    logger.info('Browser');
    if (typeof connector === 'undefined') {
      const WalletConnect = require('@walletconnect/client').default;
      WalletConnect.prototype.sign = require('../signers/WalletConnect');
      connector = new WalletConnect({
        bridge: 'https://bridge.walletconnect.org',
        qrcodeModal: require('algorand-walletconnect-qrcode-modal'),
      });
    }
  } else {
    logger.info('Node');
    throw new Error('Wallet is not supported!!!');
  }
  return connector;
}

module.exports = makeConnector();
