/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const compile = require('./index');

it('should have a compile export', ()=>{
  expect(compile).toBeInstanceOf(Function);
  expect(compile.withLogicSigAccount).toBeInstanceOf(Function);
  expect(compile.withOrderbookEntry).toBeInstanceOf(Function);
  expect(compile.withUnits).toBeInstanceOf(Function);
});
