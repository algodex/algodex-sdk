/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const withUnits = require('./withUnits.js');

it('should add algorand units', ()=>{
  const order = require('../../__tests__/Orders.json')[0];
  const res = withUnits(order);
  expect(res).toEqual({
    ...order,
    contract: {
      'D': 235,
      'N': 1,
      'amount': 100000,
      'total': 23500000,
    },
  });
});

it('should add algorand units with scientific notation', ()=>{
  const order = require('../../__tests__/Orders.json')[0];
  order.price = 1e-7;
  const res = withUnits(order);
  expect(res).toEqual({
    ...order,
    contract: {
      'D': 1,
      'N': 10000000,
      'amount': 100000,
      'total': 23500000,
    },
  });
});
