const AlgodexApi = require('./AlgodexApi');
const ValidationError = require('./Errors/ValidationError');
const algosdk = require('algosdk');

/**
 *
 * @type {spec.APIProperties}
 */
const apiProps = {
  config: {
    'algod': {
      'uri': 'https://testnet.algoexplorerapi.io',
      'token': '',
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
