it('should construct a ALgod Error', ()=>{
  const AlgodError = require('./AlgodError');
  const err = new AlgodError('Hmm');
  expect(err).toBeInstanceOf(TypeError);
  expect(err).toBeInstanceOf(AlgodError);
});
