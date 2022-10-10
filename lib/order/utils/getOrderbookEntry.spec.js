/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const orders = require('../../__tests__/Orders.json');
const withUnits = require('../compile/withUnits');
const getOrderbookEntry = require('./getOrderbookEntry');

it('should create an orderbook entry', ()=>{
  orders.map((order)=>{
    const o = withUnits(order);

    const {contract: {N, D}, asset: {id}, address, min=0} = o;
    const check = order.execution === 'maker' ?
      `${address}-${N}-${D}-${min}-${id}` :
      `${N}-${D}-${min}-${id}`;
    expect( getOrderbookEntry(o)).toEqual(check);
  });
});
