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
