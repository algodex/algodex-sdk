const ExplorerClient = require('./ExplorerClient.js');
const HTTPClient = require('../HTTPClient.js');

// Mock outside of Integration Tests:
if (process.env.TEST_ENV !== 'integration') {
  jest.setMock('../HTTPClient.js', require('../__mocks__/HTTPClient.js'));
}

// Test Parameters
const BASE_URL = 'https://indexer.testnet.algoexplorerapi.io';
const VERIFIED_ASSET_ID = '14704676';
const ASSET_ID = '15322902';
// Constructed API
let api;

// Combined Integration and Unit Tests
describe('http/clients/ExplorerClient', ()=>{
  // Statics and Construction
  it('should construct an instance', ()=>{
    api = new ExplorerClient(BASE_URL);
    expect(api).toBeInstanceOf(ExplorerClient);
    expect(api).toBeInstanceOf(HTTPClient);
  });

  // Prototypes and instances
  describe('ExplorerClient.prototype', ()=>{
    it('should fetch asset info', async ()=>{
      await expect(api.fetchExplorerAssetInfo())
          .rejects
          .toThrow('Must have ID');

      const res = await api.fetchExplorerAssetInfo(ASSET_ID);
      const verRes = await api.fetchExplorerAssetInfo(VERIFIED_ASSET_ID);

      // TODO: Better type introspection
      expect(Object.keys(res).length).toBeGreaterThan(0);
      expect(Object.keys(verRes).length).toBeGreaterThan(0);
    });

    it('should fetch explorer search', async ()=>{
      const res = await api.fetchExplorerSearch(ASSET_ID);

      // TODO: Better type introspection
      expect(Object.keys(res).length).toBeGreaterThan(0);
    });

    it('should fetch algorand price', async ()=>{
      const res = await api.fetchAlgorandPrice();

      // TODO: Better type introspection
      expect(Object.keys(res).length).toBeGreaterThan(0);
    });
  });
});
