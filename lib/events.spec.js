/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

describe('Events', ()=>{
  it('should get the emitter', ()=>{
    const ee = require('./events');
    const onSpy = jest.fn();
    const payload = {
      type: 'buy',
      amount: 100,
    };
    ee.on('orders', onSpy);
    ee.once('orders', onSpy);
    ee.emit('orders', payload);
    ee.off('orders', onSpy);
    expect(onSpy).toBeCalledWith(payload);
  });
});
