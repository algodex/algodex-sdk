const algosdk = require('algosdk');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../../teal/test/config');
const makeApplicationCreateTxn = require('./makeApplicationCreateTxn');

describe('makeApplicatoinCreateTxn', ()=>{
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
    }
  });
  it('should create an application from a string', async ()=>{
    const txn = await makeApplicationCreateTxn(config.client, 'buy', algosdk.generateAccount());
    expect(txn).toBeInstanceOf(algosdk.Transaction);
    expect(txn.type).toEqual('appl');
    expect(txn.appArgs.length).toEqual(0);
  });
});
