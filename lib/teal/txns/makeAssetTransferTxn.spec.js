const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../test/config');
const makeAssetTransferTxn = require('./makeAssetTransferTxn');

describe('teal.txns.makeAssetTransferTxn()', ()=>{
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
    }
  });

  it('should have a valid client', async ()=>{
    await expect(makeAssetTransferTxn(
        undefined,
    )).rejects.toBeInstanceOf(AlgodError);
  });

  it('should have a from account', async ()=>{
    await expect(makeAssetTransferTxn(
        config.client,
        {addr: 1234},
    )).rejects.toBeInstanceOf(TypeError);
  });

  it('should have a to account', async ()=>{
    await expect(makeAssetTransferTxn(
        config.client,
        config.creatorAccount,
        {addr: 1234},
    )).rejects.toBeInstanceOf(TypeError);
  });
  it('should have an amount', async ()=>{
    await expect(makeAssetTransferTxn(
        config.client,
        config.creatorAccount,
        config.openAccount,
        'a',
    )).rejects.toBeInstanceOf(TypeError);
  });
  it('should have a asset index', async ()=>{
    await expect(makeAssetTransferTxn(
        config.client,
        config.creatorAccount,
        config.openAccount,
        1,
        'a',
    )).rejects.toBeInstanceOf(TypeError);
  });
  it('should create an asset transfer transaction', async ()=>{
    const txn = await makeAssetTransferTxn(
        config.client,
        config.creatorAccount,
        config.openAccount,
        1,
        config.assetIndex,
        config.suggestedParams,
        false,
    );
    expect(txn).toBeInstanceOf(algosdk.Transaction);
    expect(txn.type).toEqual('axfer');
    expect(txn.assetIndex).toEqual(config.assetIndex);
  });
  it('should create an account closeout transaction', async ()=>{
    const txn = await makeAssetTransferTxn(
        config.client,
        config.creatorAccount,
        config.openAccount,
        1,
        config.assetIndex,
        config.suggestedParams,
        true,
    );
    expect(txn).toBeInstanceOf(algosdk.Transaction);
    expect(txn.type).toEqual('axfer');
    expect(txn.assetIndex).toEqual(config.assetIndex);
    expect(Object.keys(txn.closeRemainderTo)).toEqual(['publicKey', 'checksum']);
  });
});
