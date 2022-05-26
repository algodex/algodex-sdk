const AlgodexApi = require('./AlgodexApi');
const ValidationError = require('./error/ValidationError');
const algosdk = require('algosdk');

// Mock outside of Integration Tests:
if (process.env.TEST_ENV !== 'integration') {
  jest.setMock('./http/HTTPClient.js', require('./http/__mocks__/HTTPClient.js'));
}

/**
 *
 * @type {spec.APIProperties}
 */
const apiProps = {
  config: {
    'algod': {
      'uri': 'http:/ec2-3-18-80-65.us-east-2.compute.amazonaws.com',
      'token': '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'port': 8080,
    },
    'indexer': {
      'uri': 'https://algoindexer.testnet.algoexplorerapi.io',
      'token': '',
    },
    'explorer': {
      'uri': 'https://indexer.testnet.algoexplorerapi.io',
      'port': '',
    },
    'dexd': {
      'uri': 'https://api-testnet-public.algodex.com/algodex-backend',
      'token': '',
    },
    'tinyman': {
      'uri': 'https://mainnet.analytics.tinyman.org',
      'token': '',
    },
  },
};

let api;

it('should construct the api', () => {
  expect(() => new AlgodexApi()).toThrowError(ValidationError);
  // Valid Config
  api = new AlgodexApi(apiProps);
  expect(api).toBeInstanceOf(AlgodexApi);

  expect(api.indexer).toBeInstanceOf(algosdk.Indexer);

  expect(api.algod).toBeInstanceOf(algosdk.Algodv2);

  api.setConfig(apiProps.config);
  expect(api.indexer).toBeInstanceOf(algosdk.Indexer);

  expect(()=>api.setConfig({})).toThrowError(ValidationError);
});

it('should set an asset', () => {
  // Valid Config
  api = new AlgodexApi(apiProps);
  expect(()=>api.setAsset({})).toThrowError(ValidationError);
  api.setAsset({
    id: 12345,
  });
  expect(api.asset).toEqual({id: 12345});
});

it('should set addresses', ()=>{
  api = new AlgodexApi(apiProps);
  expect(()=>api.setAddresses({})).toThrowError(ValidationError);
  expect(()=>api.setAddresses([{'should': 'fail'}])).toThrowError(ValidationError);
  expect(()=>api.setAddresses([{'should': 'fail'}], {throw: false})).toBeUndefined;

  api.setAddresses([{
    address: 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I',
    type: 'sdk',
  }]);

  expect(api.addresses.length).toEqual(1);

  api.setAddresses([{
    address: 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I',
    type: 'sdk',
  }], {merge: true});
  expect(api.addresses.length).toEqual(1);
});

it('should set a wallet', ()=>{
  api = new AlgodexApi(apiProps);
  expect(()=>api.setWallet()).toThrowError('Must have valid wallet');
  expect(()=>api.setWallet({
    address: 'TNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I',
    type: 'sdk',
    test: 'first',
  })).toThrowError(ValidationError);
  api.setWallet({
    address: 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I',
    type: 'sdk',
    test: 'first',
  });
  expect(api.wallet.type).toEqual('sdk');
  api.setWallet({
    address: 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I',
    type: 'sdk',
    test: 'second',
    third: true,
  }, {merge: true});
  expect(api.wallet.test).toEqual('second');
  expect(api.wallet.third).toEqual(true);
});
it.skip('should set an order', ()=>{
  api = new AlgodexApi(apiProps);
  const testOrder = require('./__tests__/Orders.json')[0];
  api.setOrder(testOrder);
  expect(api.order).toEqual(testOrder);
});
it.skip('should place an order', async ()=>{
  const testOrder = require('./__tests__/Orders.json')[1];
  const wallet = {
    'type': 'sdk',
    'connector': require('./wallet/connectors/AlgoSDK'),
    'address': 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I',
    'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
  };
  wallet.connector.connected = true;
  api = new AlgodexApi(apiProps);
  await expect(()=>api.placeOrder(testOrder))
      .rejects
      .toThrowError('No wallet found!');
  await expect(()=>api.placeOrder(testOrder, {wallet: {}}))
      .rejects
      .toThrowError('Must connect wallet!');
  await expect(()=>api.placeOrder({...testOrder, asset: {id: 1234}}, {wallet}))
      .rejects
      .toThrowError('Invalid Asset');

  api.setWallet(wallet);

  const res = await api.placeOrder(
      testOrder);

  // TODO: Finish structure sign and send steps
  expect(res[0].lsig).toBeInstanceOf(algosdk.LogicSigAccount);
}, 10000);

it('should check validate option', ()=>{
  expect(AlgodexApi._hasValidateOption()).toEqual(false);
  expect(AlgodexApi._hasValidateOption({})).toEqual(false);
  expect(AlgodexApi._hasValidateOption({validate: false})).toEqual(false);
  expect(AlgodexApi._hasValidateOption({validate: true})).toEqual(true);
});

it('should get a validation error', ()=>{
  expect(AlgodexApi._getValidationError()).toEqual(undefined);
  expect(AlgodexApi._getValidationError(
      'https://google.com', 'URI', {validate: true},
  )).toEqual(undefined);
  expect(AlgodexApi._getValidationError(
      'Not a URI', 'URI', {validate: true},
  )).toBeInstanceOf(ValidationError);
});

it('should get a setter error', ()=>{
  const conf = {key: 'URI', initialized: true, options: {validate: true}};
  expect(AlgodexApi._getSetterError()).toBeInstanceOf(Error);
  expect(AlgodexApi._getSetterError( 'https://google.com', conf ))
      .toEqual(undefined);
  expect(AlgodexApi._getSetterError('Not a URI', conf))
      .toBeInstanceOf(ValidationError);
});

it('should filter existing wallets', ()=>{
  expect(()=>AlgodexApi._filterExistingWallets()).toThrowError(TypeError);
  expect(()=>AlgodexApi._filterExistingWallets([])).toThrowError(TypeError);
  expect(
      AlgodexApi._filterExistingWallets(
          [{address: 1}], [{address: 1}],
      ).length,
  ).toEqual(0);
});
