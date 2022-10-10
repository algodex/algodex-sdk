/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const withOrderbookEntry = require('./withOrderbookEntry');
const withUnits = require('./withUnits');
const orders = require('../../__tests__/Orders.json');

it('should throw error when missing parameters', ()=>{
  const order = orders[0];
  // Invalid missing N/D
  expect(()=>withOrderbookEntry(order)).toThrowError(TypeError);
  // Missing D
  expect(()=>withOrderbookEntry({
    ...order,
    contract: {
      ...order.contract,
      N: 1,
    },
  })).toThrowError(TypeError);
});

it('should create an orderbook entry', ()=>{
  orders.map((order)=>{
    const o = withOrderbookEntry(withUnits(order));
    expect(typeof o.contract.entry).toEqual('string');
  });
});
