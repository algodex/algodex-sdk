/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const compileDelegateTemplate = require('./compileDelegateTemplate');
const withUnits = require('./withUnits');

const order = require('../../__tests__/Orders.json')[0];


it('should compileDelegateTemplate', ()=>{
  expect(
      typeof compileDelegateTemplate(withUnits(order)),
  ).toBe('string');
});

it('should _getTemplateErrors', ()=>{
  const {_mapOrderToTemplateArgs, _getTemplateErrors} = compileDelegateTemplate;
  const errs = _getTemplateErrors();
  expect(
      errs.length,
  ).toEqual(5);
  errs.forEach((err)=>{
    expect(err).toBeInstanceOf(TypeError);
  });
  expect(
      _getTemplateErrors(_mapOrderToTemplateArgs(withUnits(order))).length,
  ).toEqual(0);
});
