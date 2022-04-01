const algosdk = require('algosdk');
const compile = require('./compile.js');
it('should compile an order', async ()=>{
  const input = require('../__tests__/Orders.json')[0];
  input.client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080 );
  const order = await compile(input);
  expect(order.contract.lsig).toBeInstanceOf(algosdk.LogicSigAccount);
});
