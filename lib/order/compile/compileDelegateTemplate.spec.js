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
