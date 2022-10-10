/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

it('should patch MyAlgoConnect', ()=>{
  if (typeof window === 'undefined') {
    expect(()=>require('./MyAlgoConnect')).toThrowError('Wallet is not supported!!!');
  } else {
    const MyAlgoConnect = require('@randlabs/myalgo-connect');
    expect(require('./MyAlgoConnect')).toBeInstanceOf(MyAlgoConnect);
  }
});
