const getWalletAssetAmount = require('./getWalletAssetAmount');

const algosdk = require('algosdk');
const token = '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259';
const server = 'http:/ec2-3-18-80-65.us-east-2.compute.amazonaws.com';
const port = 8080;

const algodClient = new algosdk.Algodv2(token, server, port);
const testAddr = 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI';
const testAssetId = 15322902;

describe('getWalletAssetAmount', ()=> {
  it('should throw an error when given an accountObject with missing properties', async () => {
    expect(() => getWalletAssetAmount({'empty': 'Object'}, testAssetId )).toThrow('AccountInfo object must have amount ');
  });

  it('should return 0 when passed in null', () => {
    expect(getWalletAssetAmount(null)).toEqual(0);
  });

  it('should return the target asset amount if it is a valid account object and the asset exists and 0 otherwsie', async () => {
    const testAccountInfo = await algodClient.accountInformation(testAddr).do();
    expect(getWalletAssetAmount(testAccountInfo, testAssetId)).toBeTruthy();
    expect(getWalletAssetAmount(testAccountInfo, 'fakeAssetId123')).toBe(0);
  }, 60000);
});
