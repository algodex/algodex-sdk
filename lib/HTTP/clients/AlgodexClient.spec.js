const AlgodexClient = require('./AlgodexClient.js');
const HTTPClient = require('../HTTPClient.js');

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
            api.aggregateOrders(res.data.sellASAOrdersInEscrow, 10, 'sell'),
        ).toEqual([{'amount': 1, 'price': '1234.123450', 'total': 1}]);
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
            api.mapOpenOrdersData(res.data),
        ).toEqual([
          {
            'amount': '9',
            'asset': {
              'id': 19267953,
            },
            'date': '2022-03-30 05:59:31',
            'metadata': {
              'algoAmount': 4225000,
              'appId': 22045503,
              'asaAmount': 0,
              'asaPrice': '470000.000000000000',
              'assetId': 19267953,
              'assetLimitPriceD': 470000,
              'assetLimitPriceInAlgos': '470000.000000000000',
              'assetLimitPriceN': 1,
              'decimals': 0,
              'escrowAddress': 'LJ3S6ORAHDULANESCNFPZLYOTP6OFIK5MVLK5SCCRQITQWVRODDAOWT3VU',
              'formattedASAAmount': '9',
              'formattedPrice': '0.470000',
              'minimumExecutionSizeInAlgo': 0,
              'ownerAddress': 'ZXPEYJMWFLULILWJHWB3Y6DFI4ADE7XVMGARAH734ZJ5ECXAR4YVMRZ4EM',
              'round': 20662233,
              'unix_time': 1648637971,
              'version': 6,
            },
            'pair': 'KFLT/ALGO',
            'price': '0.4700',
            'status': 'OPEN',
            'type': 'BUY',
            'unix_time': 1648637971,
          },
          {
            'amount': '7',
            'asset': {
              'id': 19267953,
            },
            'date': '2022-03-29 17:17:37',
            'metadata': {
              'algoAmount': 3266000,
              'appId': 22045503,
              'asaAmount': 0,
              'asaPrice': '469000.000000000000',
              'assetId': 19267953,
              'assetLimitPriceD': 469000,
              'assetLimitPriceInAlgos': '469000.000000000000',
              'assetLimitPriceN': 1,
              'decimals': 0,
              'escrowAddress': 'OLFLPHAL3BJH2ONOHPATQBSMIXH6VL3PXTVIC2IS3IRQSW6MABVZUMD7HI',
              'formattedASAAmount': '7',
              'formattedPrice': '0.469000',
              'minimumExecutionSizeInAlgo': 0,
              'ownerAddress': 'ZXPEYJMWFLULILWJHWB3Y6DFI4ADE7XVMGARAH734ZJ5ECXAR4YVMRZ4EM',
              'round': 20651446,
              'unix_time': 1648592257,
              'version': 6,
            },
            'pair': 'KFLT/ALGO',
            'price': '0.4690',
            'status': 'OPEN',
            'type': 'BUY',
            'unix_time': 1648592257,
          },
        ]);
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
      });
    });
  });
});
