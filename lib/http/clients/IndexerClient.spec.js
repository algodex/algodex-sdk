const IndexerClient = require('./IndexerClient.js');
const HTTPClient = require('../HTTPClient.js');

// Mock outside of Integration Tests:
if (process.env.TEST_ENV !== 'integration') {
  jest.setMock('../HTTPClient.js', require('../__mocks__/HTTPClient.js'));
}

// Test Parameters
const BASE_URL = 'https://algoindexer.testnet.algoexplorerapi.io';
const WALLET = 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I';

// Constructed API
let api;
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
    'dexd': {
      'uri': 'https://api-testnet-public.algodex.com/algodex-backend',
      'token': '',
    },
  },
};
// Combined Integration and Unit Tests
describe('http/clients/IndexerClient', ()=>{
  // Statics and Construction
  it('should construct an instance', ()=>{
    api = new IndexerClient(BASE_URL, false, apiProps.config);
    expect(api).toBeInstanceOf(IndexerClient);
    expect(api).toBeInstanceOf(HTTPClient);
  });

  // Prototypes and instances
  describe('IndexerClient.prototype', ()=>{
    it('should fetch account info', async ()=>{
      await expect(api.fetchAccountInfo())
          .rejects
          .toThrow('Must have a valid wallet!');

      const res = await api.fetchAccountInfo({address: WALLET});

      // TODO: Better type introspection
      expect(Object.keys(res).length).toBeGreaterThan(0);
    });
    it('should fetch multiple accounts', async ()=>{
      await expect(api.fetchAccounts())
          .rejects
          .toThrow('Addresses must be an Array!');

      const res = await api.fetchAccounts([{address: WALLET}]);

      // TODO: Better type introspection
      expect(Object.keys(res).length).toBeGreaterThan(0);
    });
  });
});
