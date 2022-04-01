const AlgodexApi = require('./AlgodexApi');
const ValidationError = require('./Errors/ValidationError');
const algosdk = require('algosdk');

// Mock outside of Integration Tests:
if (process.env.TEST_ENV !== 'integration') {
  jest.setMock('./HTTP/HTTPClient.js', require('./HTTP/__mocks__/HTTPClient.js'));
}

/**
 *
 * @type {spec.APIProperties}
 */
const apiProps = {
  config: {
    'algod': {
      'uri': 'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com',
      'token': '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'port': 8080,
    },
    'indexer': {
      'uri': 'https://algoindexer.testnet.algoexplorerapi.io',
      'token': '',
    },
    'dexd': {
      'uri': 'https://testnet.algodex.com/algodex-backend',
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
});

it('should place an order', async ()=>{
  const testOrder = require('./__tests__/Orders.json')[0];

  const order = await api.placeOrder(
      testOrder, {wallet: {
        type: 'sdk',
        connector: {
          connected: true,
        },
        address: 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I',
      }});

  // TODO: Finish structure sign and send steps
  expect(order.contract.lsig).toBeInstanceOf(algosdk.LogicSigAccount);
});

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
