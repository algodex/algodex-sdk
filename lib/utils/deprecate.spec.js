const deprecate = require('./deprecate');
describe('lib/utils/deprecate.js', ()=>{
  it('should deprecate a function', ()=>{
    const testFn = ()=>{};
    expect(deprecate).toBeInstanceOf(Function);
    expect(deprecate(testFn, {file: module.filename})).toEqual(testFn);
  });
});
