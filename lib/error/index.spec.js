const errors = require('./index');
it('should have a error exports', ()=>{
  expect(errors.ValidationError).toBeInstanceOf(Function);
  expect(errors.AlgodError).toBeInstanceOf(Function);
});
