const fetchWallets = require('./fetchWallets');

// TODO: Add mock interface for indexer
it('should map addresses to account info', async ()=>{
  const result = await fetchWallets({
    'indexer': {
      'uri': 'https://algoindexer.testnet.algoexplorerapi.io',
      'token': '',
    },
  }, [{
    address: 'TJFFNUYWHPPIYDE4DGGYPGHWKGAPJEWP3DGE5THZS3B2M2XIAPQ2WY3X4I',
  }]);
  expect(result.wallets.length).toBeGreaterThan(0);
});
