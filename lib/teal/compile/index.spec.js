const compile = require('./index');

it('should export compile', ()=>{
  expect(compile.compileTemplate).toBeInstanceOf(Function);
  expect(compile.compileProgram).toBeInstanceOf(Function);
  expect(compile.compileLogicSig).toBeInstanceOf(Function);
});
