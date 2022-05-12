const algosdk = require('algosdk');
const compile = require('./compile.js');
it('should compile a sell order', async ()=>{
  const input = {
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'type': 'sell',
    'price': 2,
    'amount': 1,
    'total': 2,
    'execution': 'taker',
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'appId': 22045503,
    'version': 6,

  };
  try {
    await compile(input);
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }
  input.client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080 );
  const order = await compile(input);
  expect(order.contract.N).toEqual(1);
  expect(order.contract.D).toEqual(2);
  expect(order.contract.amount).toEqual(1000000);
  expect(order.contract.lsig).toBeInstanceOf(algosdk.LogicSigAccount);
});
it('should compile a non-standard sell order', async ()=>{
  const input = {
    'asset': {
      'id': 69410904,
      'decimals': 10,
    },
    'type': 'sell',
    'price': 2,
    'amount': 1,
    'total': 2,
    'execution': 'taker',
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'appId': 22045503,
    'version': 6,

  };
  try {
    await compile(input);
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }
  input.client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080 );
  const order = await compile(input);
  expect(order.contract.N).toEqual(10000);
  expect(order.contract.D).toEqual(2);
  expect(order.contract.amount).toEqual(10000000000);
  expect(order.contract.lsig).toBeInstanceOf(algosdk.LogicSigAccount);
});
it('should compile a buy order', async ()=>{
  const input = {
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'type': 'buy',
    'price': 2,
    'amount': 1,
    'total': 2,
    'execution': 'taker',
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'appId': 22045503,
    'version': 6,

  };
  try {
    await compile(input);
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }
  input.client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080 );
  const order = await compile(input);
  expect(order.contract.N).toEqual(1);
  expect(order.contract.D).toEqual(2);
  expect(order.contract.amount).toEqual(1000000);
  expect(order.contract.lsig).toBeInstanceOf(algosdk.LogicSigAccount);
});
