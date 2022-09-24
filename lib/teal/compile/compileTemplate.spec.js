/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const compileTemplate = require('./compileTemplate');
const template = `
  <replace> key
  should be <replace>
`;
const result = `
  test key
  should be test
`;
it('should compile templates', ()=>{
  // Error no data
  expect(()=>compileTemplate()).toThrowError(TypeError);
  // Error no template
  expect(()=>compileTemplate({replace: 'test'})).toThrowError(TypeError);

  expect(compileTemplate({replace: 'test'}, template)).toEqual(result);
});
