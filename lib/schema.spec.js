const ajv = require('./schema');
const algosdk = require('algosdk');
const client = new algosdk.Algodv2('', 'https://node.algoexplorerapi.io', '');
it('should instanceof check', ()=>{
  expect(ajv.validate({instanceof: 'Ajv'}, ajv)).toEqual(true);
  expect(ajv.validate({instanceof: 'Algodv2'}, client)).toEqual(true);
});
