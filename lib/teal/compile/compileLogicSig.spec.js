const algosdk = require('algosdk');
const compileLogicSig = require('./compileLogicSig');
const teal = require('../ClearProgram.teal');
it('should compile a LogicSigAccount', async ()=>{
  const client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080 );

  try {
    await compileLogicSig();
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }
  try {
    await compileLogicSig(client);
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }

  const lsig = await compileLogicSig(client, teal);
  expect(lsig).toBeInstanceOf(algosdk.LogicSigAccount);
});
