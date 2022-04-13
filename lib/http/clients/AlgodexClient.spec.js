const AlgodexClient = require('./AlgodexClient.js');
const HTTPClient = require('../HTTPClient.js');
const {executeOrder} = require('../../functions/base');

// Mock outside of Integration Tests:
if (process.env.TEST_ENV !== 'integration') {
  jest.setMock('../HTTPClient.js', require('../__mocks__/HTTPClient.js'));
}

// Test Parameters
const BASE_URL = 'https://api-testnet-public.algodex.com/algodex-backend';
const ASSET_ID = '15322902';
const WALLET = 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I';
const CHART_INTERVAL = '1h';

// Constructed API
let api;

// Combined Integration and Unit Tests
describe('http/clients/AlgodexClient', ()=>{
  // Statics and Construction
  it('should construct an instance', ()=>{
    api = new AlgodexClient(BASE_URL);
    expect(api).toBeInstanceOf(AlgodexClient);
    expect(api).toBeInstanceOf(HTTPClient);
  });

  // Prototypes and instances
  describe('AlgodexClient.prototype', ()=>{
    describe('Asset', ()=>{
      it('should fetch asset chart data', async ()=>{
        const res = await api.fetchAssetChart(ASSET_ID, CHART_INTERVAL);

        // TODO: Better type introspection
        expect(Object.keys(res).length).toBeGreaterThan(0);
      });

      it('should fetch assets', async ()=>{
        const res = await api.fetchAssets();

        // TODO: Better type introspection
        expect(res.length).toBeGreaterThan(0);
      });

      it('should fetch asset price', async ()=>{
        const res = await api.fetchAssetPrice(ASSET_ID);

        // TODO: Better type introspection
        expect(Object.keys(res).length).toBeGreaterThan(0);
      });

      it('should search assets', async ()=>{
        const res = await api.searchAssets(ASSET_ID);

        // TODO: Better type introspection
        expect(Object.keys(res).length).toBeGreaterThan(0);
      });

      it('should fetch asset orders', async ()=>{
        const res = await api.fetchAssetOrders(ASSET_ID);

        // TODO: Better type introspection
        expect(Object.keys(res).length).toBeGreaterThan(0);
        expect(
            Object.keys(
                api.aggregateOrders(
                    res.sellASAOrdersInEscrow,
                    10,
                    'sell')[0],
            ),
        ).toEqual(['price', 'amount', 'total']);
      });

      it('should fetch asset trade history', async ()=>{
        const res = await api.fetchAssetTradeHistory(ASSET_ID);

        // TODO: Better type introspection
        expect(Object.keys(res).length).toBeGreaterThan(0);
      });
    });

    describe('Wallet', () => {
      it('should fetch wallet orders', async ()=>{
        const res = await api.fetchWalletOrders(WALLET);

        // TODO: Better type introspection
        expect(Object.keys(res).length).toBeGreaterThan(0);

        // TODO: Move to notes field
        expect(
            api.mapOpenOrdersData(res).length,
        ).toBeGreaterThan(0);
      });

      it('should fetch wallet assets', async ()=>{
        const res = await api.fetchWalletAssets(WALLET);

        // TODO: Better type introspection
        expect(Object.keys(res).length).toBeGreaterThan(0);
      });

      it('should fetch wallet trade history', async ()=>{
        const res = await api.fetchWalletTradeHistory(WALLET);

        // TODO: Better type introspection
        expect(Object.keys(res).length).toBeGreaterThan(0);

        expect(api.mapTradeHistoryData(res).length).toBeGreaterThan(0);
      });
    });
  });
});
