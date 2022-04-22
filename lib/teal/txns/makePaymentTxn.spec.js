const algosdk = require('algosdk');
const AlgodError = require('../../Errors/AlgodError');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../test/config');
const makePaymentTxn = require('./makePaymentTxn');

describe('teal.txns.makePaymentTxn()', ()=>{
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
    }
  });

  it('should have a valid client', async ()=>{
    await expect(makePaymentTxn(
        undefined,
    )).rejects.toBeInstanceOf(AlgodError);
  });

  it('should have a from account', async ()=>{
    await expect(makePaymentTxn(
        config.client,
        {addr: 1234},
    )).rejects.toBeInstanceOf(TypeError);
  });

  it('should have a to account', async ()=>{
    await expect(makePaymentTxn(
        config.client,
        config.creatorAccount,
        {addr: 1234},
    )).rejects.toBeInstanceOf(TypeError);
  });
  it('should have an amount', async ()=>{
    await expect(makePaymentTxn(
        config.client,
        config.creatorAccount,
        config.openAccount,
        'a',
    )).rejects.toBeInstanceOf(TypeError);
  });
  it('should create an payment transaction', async ()=>{
    const txn = await makePaymentTxn(
        config.client,
        config.creatorAccount,
        config.openAccount,
        1,
        undefined,
        undefined,
        config.suggestedParams,
        undefined,
        false,
    );
    expect(txn).toBeInstanceOf(algosdk.Transaction);
    expect(txn.type).toEqual('pay');
    expect(txn.amount).toEqual(1);
  });
  it('should create an payment transaction', async ()=>{
    const txn = await makePaymentTxn(
        config.client,
        config.creatorAccount,
        config.openAccount,
        1,
        undefined,
        undefined,
        config.suggestedParams,
        undefined,
        true,
    );
    expect(txn).toBeInstanceOf(algosdk.Transaction);
    expect(txn.type).toEqual('pay');
    expect(txn.amount).toEqual(1);
  });
});
