const algodex = require('../algodex_api.js');
const base = require('./functions/base.js');
const testWallet = 'DFV2MR2ILEZT5IVM6ZKJO34FTRROICPSRQYIRFK4DHEBDK7SQSA4NEVC2Q';
const transactionGenerator = require('../generate_transaction_types.js');
const testHelper = require('../test/setup.js');
const orderBookEntry = require('../test/fixtures/allOrderBooks.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const allOrderBookOrders = require('../test/fixtures/allOrderBooks.js');


const config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
  executorAccount: testHelper.getRandomAccount(),
  openAccount: testHelper.getOpenAccount(),
  maliciousAccount: testHelper.getRandomAccount(),
  client: testHelper.getLocalClient(),
  assetId: 15322902,
};

test.skip('executeOrder& marketOrder & structureOrder', async () => {
  // config, client, isSellingAsa, price, algoAmount, asaAmount, incluedMaker, walletConnector, shouldErr
  algodex.initSmartContracts('test');
  const client = config.client;
  const mockRawTransactions = new function(signed) {
    this.do = () => {
      return {txId: signed};
    };
  }();

  client.sendRawTransaction = jest.fn(() => mockRawTransactions);

  const waitForConfirmationMock = jest.spyOn(algodex, 'waitForConfirmation').mockImplementation((txn) => {
    return new Promise((resolve, reject) => {
      resolve({
        data: {
          txId: 'fakeId',
          status: 'confirmed',
          statusMsg: `Transaction confirmed in round  fakeRound`,
          transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
        },
      });
    });
  });


  const buyLimitPrice = 2000;
  const buyOrderAssetAmount = 1000;
  const buyOrderAlgoAmount = 2000000;

  const sellLimitPrice = 1700;
  const sellOrderAssetAmount = 1000;
  const sellOrderAlgoAmount = 1700000;

  // Buy no Maker
  expect(await algodex.executeOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, allOrderBookOrders, false )).toBe(undefined);
  expect(await algodex.structureOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, allOrderBookOrders, false )).toBeTruthy();

  // Buy with maker
  expect(await algodex.executeOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAssetAmount, 1000000, allOrderBookOrders, true )).toBe(undefined);
  // Buy with null orderbook
  expect(await algodex.executeOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, null, false )).toBe(undefined);

  //  Sell with no Maker
  //  expect(await algodex.executeOrder(client, true, config.assetId, testWallet, sellLimitPrice, sellOrderAssetAmount, sellOrderAlgoAmount, allOrderBookOrders, false )).toBe(undefined)

  // MarketOrder
  expect(await algodex.executeMarketOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, allOrderBookOrders, false )).toBe(undefined);

  waitForConfirmationMock.mockRestore();
}, JEST_MINUTE_TIMEOUT);
test('allSettled', async () => {
  const resolvedPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('always resolves');
    }, 300);
  });

  const rejectedPromise = new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('always rejects'));
    }, 300);
  });

  const promisesArr = [resolvedPromise, rejectedPromise];
  expect(await base.allSettled(promisesArr)).toBeTruthy();
});
test.skip('signAndSendTransactions & signMyAlgo & propogateTransactions', async () => {
  algodex.initSmartContracts('test');
  const client = config.client;
  const mockRawTransactions = new function(signed) {
    this.do = () => {
      return {txId: true};
    };
  }();

  const waitForConfirmationMock = jest.spyOn(algodex, 'waitForConfirmation').mockImplementation((txn) => {
    return new Promise((resolve, reject) => {
      resolve({
        data: {
          txId: 'fakeId',
          status: 'confirmed',
          statusMsg: `Transaction confirmed in round  fakeRound`,
          transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
        },
      });
    });
  });

  client.sendRawTransaction = jest.fn(() => mockRawTransactions);
  const transactions = await transactionGenerator.getPlaceASAEscrowOrderTxns(config.client, config.creatorAccount, 1, 2, config.assetId, 10, true );
  transactions[0]['needsUserSig'] = true;
  transactions[3]['needsUserSig'] = true;


  expect(await algodex.signAndSendTransactions(client, transactions)).toBeTruthy();
  expect(await algodex.signMyAlgo(client, transactions)).toBeTruthy();
  expect(await algodex.propogateTransactions(client, transactions));

  waitForConfirmationMock.mockRestore();
});

test.skip('signAndSendWalletConnectTransactions', async () => {
  algodex.initSmartContracts('test');
  const client = base.initAlgodClient('test');
  const mockRawTransactions = new function(signed) {
    this.do = () => {
      return {txId: true};
    };
  }();

  // mimicking the shape of WalletConnector instance and the only properties used in SignAndSendWalletConnect
  const walletConnector = {connector: {
    accounts: [config.creatorAccount.addr],
    sendCustomRequest: (request) => new Promise((resolve, reject) => {
      resolve(request.params[0].map((element) => new ArrayBuffer(element)));
    }),

  }};
  const params = await client.getTransactionParams().do();

  client.sendRawTransaction = jest.fn(() => mockRawTransactions);
  const transactions = await transactionGenerator.getPlaceASAEscrowOrderTxns(config.client, config.creatorAccount, 1, 2, config.assetId, 10, true );
  transactions[0]['needsUserSig'] = true;
  transactions[3]['needsUserSig'] = true;

  algodex.signAndSendWalletConnectTransactions(client, transactions, params, walletConnector );
});

test('initSmartContracts', () => {
  expect(base.initSmartContracts('local')).toBe(undefined);
  expect(base.initSmartContracts('test')).toBe(undefined);
  expect(base.initSmartContracts('public_test')).toBe(undefined);
  expect(base.initSmartContracts('production')).toBe(undefined);
  // expect(algodex.initSmartContracts('Error')).toThrow("environment must be local, test, or production")
});

test('initIndexer', () => {
  expect(base.initIndexer('local')).toBeTruthy();
  expect(base.initIndexer('test')).toBeTruthy();
  expect(base.initIndexer('public_test')).toBeTruthy();
  expect(base.initIndexer('production')).toBeTruthy();
});

test('initAlgodClient', () => {
  expect(base.initAlgodClient('local')).toBeTruthy();
  expect(base.initAlgodClient('test')).toBeTruthy();
  expect(base.initAlgodClient('public_test')).toBeTruthy();
  expect(base.initAlgodClient('production')).toBeTruthy();
});

test.skip('getMinWalletBalance', () => {
  const accountInfoMock = jest.spyOn(algodex, 'getAccountInfo').mockImplementation((addr) => {
    return {
      'address': 'FAKEADDR',
      'created-apps': [true, 'many', 'apps'],
      'assets': ['there', 'are', 'many', 'assets'],
      'apps-total-schema': {
        'num-uint': 4,
        'num-byte-slice': 3,
      },
    };
  });
  expect(algodex.getMinWalletBalance('fakeaddress')).toBeTruthy();

  accountInfoMock.mockRestore();
});


test('createOrderBookEntryObject', () => {
  order = orderBookEntry[0];
  const args = [];
  for (key in order) {
    args.push(order[key]);
  }

  expect(base.createOrderBookEntryObj(...args)).toBeTruthy();
  // order.orderBookEntry, 15, 1, 15, 0, order.escrowAddr, order.algoBalance, order.asaBalance, 'sell', true, order.orderCreatorAddr, order.assetId, order.version
});


test('finalPriceCheck', () => {
  try {
    base.finalPriceCheck(100, 50, .5, false);
  } catch (e) {
    expect(e.message).toBe('Attempting to buy at a price higher than limit price');
  }

  try {
    base.finalPriceCheck(50, 1000, .5, true);
  } catch (e) {
    expect(e.message).toBe('Attempting to sell at a price lower than limit price');
  }
  expect( base.finalPriceCheck(100, 50, .5, true)).toBe(undefined);
},
);

test('getAlgoandAsaAmounts', async () => {
  base.initSmartContracts('test');
  const client = base.initAlgodClient('test');
  // new AssetTransferTxn => AssetTransferTxn is not a function
  const transactions = await transactionGenerator.getPlaceASAEscrowOrderTxns(client, config.creatorAccount, 1, 2, config.assetId, 10, true );
  expect(base.getAlgoandAsaAmounts(transactions)).toBeTruthy();
});

test('getPlaceAlgosToBuyASAOrderIntoOrderbook', async () => {
  const client = base.initAlgodClient('test');

  expect(await base.getPlaceAlgosToBuyASAOrderIntoOrderbook(client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await base.getPlaceAlgosToBuyASAOrderIntoOrderbookV2(client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();


  // wallet that isn't empty
  expect(await algodex.getPlaceAlgosToBuyASAOrderIntoOrderbook(client, testWallet, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await algodex.getPlaceAlgosToBuyASAOrderIntoOrderbookV2(client, testWallet, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
});

test('getPlaceASAToSellASAOrderIntoOrderbook', async () => {
  const client = base.initAlgodClient('test');

  expect(await base.getPlaceASAToSellASAOrderIntoOrderbook(client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await algodex.getPlaceASAToSellASAOrderIntoOrderbookV2(config.client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
});


test.skip('closeOrderFromOrderBookEntry', async () => {
  algodex.initSmartContracts('test');
  const client = config.client;


  const getAccountInfoMock = jest.spyOn(algodex, 'getAccountInfo').mockImplementation((addr) => {
    return new Promise((resolve, reject) => {
      resolve({

        txId: 'fakeId',
        status: 'confirmed',
        assets: [{'asset-id': config.assetId}],
        transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
      },
      );
    });
    // assetId = accountInfo['assets'][0]['asset-id'];
  });
  const mockRawTransactions = new function(signed) {
    this.do = () => {
      return {txId: true};
    };
  }();
  client.sendRawTransaction = jest.fn(() => mockRawTransactions);

  const generatedOrderBookEntry = algodex.generateOrder(config.creatorAccount.addr, 2, 1, 0, config.assetId, false);

  try {
    await algodex.closeOrderFromOrderBookEntry(client, config.executorAccount.addr, config.creatorAccount.addr, generatedOrderBookEntry, 6);
  } catch (e) {
    expect(typeof e).toBe('string');
  }


  expect(algodex.createOrderBookEntryObj(...args)).toBeTruthy();
  // order.orderBookEntry, 15, 1, 15, 0, order.escrowAddr, order.algoBalance, order.asaBalance, 'sell', true, order.orderCreatorAddr, order.assetId, order.version
});


test('finalPriceCheck', () => {
  try {
    base.finalPriceCheck(100, 50, .5, false);
  } catch (e) {
    expect(e.message).toBe('Attempting to buy at a price higher than limit price');
  }

  try {
    base.finalPriceCheck(50, 1000, .5, true);
  } catch (e) {
    expect(e.message).toBe('Attempting to sell at a price lower than limit price');
  }
  expect( base.finalPriceCheck(100, 50, .5, true)).toBe(undefined);
},
);

test.skip('getAlgoandAsaAmounts', async () => {
  algodex.initSmartContracts('test');
  const client = base.initAlgodClient('test');

  // TypeError: AssetTransferTxn is not a constructor

  const transactions = await transactionGenerator.getPlaceASAEscrowOrderTxns(client, config.creatorAccount, 1, 2, config.assetId, 10, true );
  expect(base.getAlgoandAsaAmounts(transactions)).toBeTruthy();
});

test('getPlaceAlgosToBuyASAOrderIntoOrderbook', async () => {
  const client = base.initAlgodClient('test');

  expect(await base.getPlaceAlgosToBuyASAOrderIntoOrderbook(client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await algodex.getPlaceAlgosToBuyASAOrderIntoOrderbookV2(config.client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();


  // wallet that isn't empty
  expect(await algodex.getPlaceAlgosToBuyASAOrderIntoOrderbook(client, testWallet, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await algodex.getPlaceAlgosToBuyASAOrderIntoOrderbookV2(config.client, testWallet, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
});

test('getPlaceASAToSellASAOrderIntoOrderbook', async () => {
  const client = base.initAlgodClient('test');
  expect(await algodex.getPlaceASAToSellASAOrderIntoOrderbook(client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await algodex.getPlaceASAToSellASAOrderIntoOrderbookV2(config.client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
});


test.skip('closeOrderFromOrderBookEntry', async () => {
  algodex.initSmartContracts('test');
  const client = config.client;


  const getAccountInfoMock = jest.spyOn(algodex, 'getAccountInfo').mockImplementation((addr) => {
    return new Promise((resolve, reject) => {
      resolve({

        txId: 'fakeId',
        status: 'confirmed',
        assets: [{'asset-id': config.assetId}],
        transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
      },
      );
    });
    // assetId = accountInfo['assets'][0]['asset-id'];
  });
  const mockRawTransactions = new function(signed) {
    this.do = () => {
      return {txId: true};
    };
  }();
  client.sendRawTransaction = jest.fn(() => mockRawTransactions);

  const generatedOrderBookEntry = algodex.generateOrder(config.creatorAccount.addr, 2, 1, 0, config.assetId, false);

  try {
    await algodex.closeOrderFromOrderBookEntry(client, config.executorAccount.addr, config.creatorAccount.addr, generatedOrderBookEntry, 6);
  } catch (e) {
    expect(typeof e).toBe('string');
  }
  getAccountInfoMock.mockRestore();
//    assetId returning null because you need to populate the test wallet to account for conditional on  665-668
// alternativeely mock this.getAccountInfo
});

