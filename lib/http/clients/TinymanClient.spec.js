const TinymanClient = require('./TinymanClient.js');
const HTTPClient = require('../HTTPClient.js');

// Mock outside of Integration Tests:
if (process.env.TEST_ENV !== 'integration') {
  jest.setMock('../HTTPClient.js', require('../__mocks__/HTTPClient.js'));
}

// Test Parameters
const BASE_URL = 'https://mainnet.analytics.tinyman.org';

// Constructed API
let api;
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
      'uri': 'https://api-testnet-public.algodex.com/algodex-backend',
      'token': '',
    },
  },
};
// Combined Integration and Unit Tests
describe('http/clients/TinymanClient', ()=>{
  // Statics and Construction
  it('should construct an instance', ()=>{
    api = new TinymanClient(BASE_URL, false, apiProps.config);
    expect(api).toBeInstanceOf(TinymanClient);
    expect(api).toBeInstanceOf(HTTPClient);
  });

  // Prototypes and instances
  describe('TinymanClient.prototype', ()=>{
    it('should fetch account info', async ()=>{
      const res = await api.fetchCurrentAssetPrices();

      // TODO: Better type introspection
      expect(Object.keys(res).length).toBeGreaterThan(0);
    }, process.env.TEST_ENV !== 'integration' ? 1000 : 10000);
  });
});
