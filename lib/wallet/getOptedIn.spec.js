const config = require('../teal/test/config');
const getOptedIn = require('./getOptedIn');
const AlgodexApi = require('../AlgodexApi');
const apiConfig = require('../../config.json');
describe('getOptedIn', ()=>{
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
      // config.setAssetIndex(21582668);
    }
  });
  it('should fetch optin status', async ()=>{
    const _optInTrue = await getOptedIn(config.api.algod, {address: config.openAccount.addr}, config.assetIndex);
    const _optInFalse = await getOptedIn(config.api.algod, {address: config.openAccount.addr}, 440307);

    expect(
        _optInTrue,
    ).toEqual(true);
    expect(
        _optInFalse,
    ).toEqual(false);
  });
});
