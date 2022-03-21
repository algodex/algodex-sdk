const AlgodexApi = require('./AlgodexApi');
const ValidationError = require('./errors/ValidationError');
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
describe('Algodex', () => {
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
});
