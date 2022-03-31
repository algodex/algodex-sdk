const algosdk = require('algosdk');
const withLogicSigAccount = require('./withLogicSigAccount');
const withUnits = require('./withUnits');
const {LogicSigAccount} = require('algosdk');
it('should compile lsig', async ()=>{
  const order = require('../../__tests__/Orders.json')[0];
  order.client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080 );

  const res = await withLogicSigAccount(withUnits(order));

  expect(res.contract.lsig).toBeInstanceOf(LogicSigAccount);
});
