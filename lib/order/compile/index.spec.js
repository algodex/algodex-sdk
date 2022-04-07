const compile = require('./index');

it('should have a compile export', ()=>{
  expect(compile).toBeInstanceOf(Function);
  expect(compile.withLogicSigAccount).toBeInstanceOf(Function);
  expect(compile.withOrderbookEntry).toBeInstanceOf(Function);
  expect(compile.withUnits).toBeInstanceOf(Function);
});
