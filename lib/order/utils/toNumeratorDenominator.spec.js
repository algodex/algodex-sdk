/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const toNumeratorDenominator = require('./toNumeratorDenominator');

it('should convert a price to N and D', ()=>{
  let nd = toNumeratorDenominator( 5.12345);
  expect(nd.D).toEqual(512345);
  expect(nd.N).toEqual(100000);

  nd = toNumeratorDenominator( 5);
  expect(nd.D).toEqual(5);
  expect(nd.N).toEqual(1);
});
