it('should construct a Validation Error', ()=>{
  const ValidationError = require('./ValidationError');
  const err = new ValidationError(
      [{instancePath: 'key', message: 'Wrong Key'}],
  );
  expect(err).toBeInstanceOf(TypeError);
  expect(err).toBeInstanceOf(ValidationError);
});
