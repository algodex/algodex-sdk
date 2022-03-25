
describe('@algodex/algodex-sdk', ()=>{
  it('should be able to be required', ()=>{
    const AlgodexApi = require('./index');
    expect(AlgodexApi).toBeInstanceOf(Function);
    expect(AlgodexApi.dumpVar).toBeInstanceOf(Function);
  });
});
