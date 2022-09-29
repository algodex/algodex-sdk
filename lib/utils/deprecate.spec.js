/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const deprecate = require('./deprecate');
describe('lib/utils/deprecate.js', ()=>{
  it('should deprecate a function', ()=>{
    const testFn = ()=>{};
    expect(deprecate).toBeInstanceOf(Function);
    expect(deprecate(testFn, {file: module.filename})).toEqual(testFn);
  });
});
