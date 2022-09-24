/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const logger = require('../../logger');
it('should patch WalletConnect', ()=>{
  if (typeof window === 'undefined') {
    logger.info('Node Test');
    expect(()=>require('./WalletConnect')).toThrowError('Wallet is not supported!!!');
  } else {
    logger.info('Browser Test');
    const WalletConnect = require('@walletconnect/client').default;
    const DexWalletConnect = require('./WalletConnect');
    expect(DexWalletConnect).toBeInstanceOf(WalletConnect);
    expect(WalletConnect.prototype.sign).toBeInstanceOf(Function);
  }
});
