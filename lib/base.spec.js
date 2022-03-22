const algodex = require('../algodex_api.js');
const base = require('./functions/base.js');
const testWallet = 'DFV2MR2ILEZT5IVM6ZKJO34FTRROICPSRQYIRFK4DHEBDK7SQSA4NEVC2Q';
const transactionGenerator = require('../generate_transaction_types.js');
const testHelper = require('../test/setup.js');
const orderBookEntry = require('../test/fixtures/allOrderBooks.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const allOrderBookOrders = require('../test/fixtures/allOrderBooks.js');
const algosdk = require('algosdk');
const axios = require('axios');


const config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
  executorAccount: testHelper.getRandomAccount(),
  openAccount: testHelper.getOpenAccount(),
  maliciousAccount: testHelper.getRandomAccount(),
  client: testHelper.getLocalClient(),
  assetId: 15322902,
};


test.skip('doAlert', () => {
  expect(base.doAlert()).toBe(undefined);
});

test('waitForConfirmation', () => {
  const axiosMock = jest.spyOn(axios, 'get').mockImplementation((addr) => {
    return new Promise((resolve, reject) => {
      resolve({

        txId: 'fakeId',
        status: 'confirmed',
        assets: [{'asset-id': config.assetId}],
        transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
      },
      );
    });
  });

  expect(base.waitForConfirmation('fake')).toBeTruthy();

  axiosMock.mockRestore();
});

test('getCutOrderTimes', () => {
  expect(base.getCutOrderTimes(orderBookEntry[0])).toBeTruthy();
});

test('generateOrder', () => {
  expect(base.generateOrder(config.creatorAccount.addr, 2, 1, 0, config.assetId, false)).toBeTruthy();
});

test('assignGroups', async () => {
  const client = base.initAlgodClient('test');

  const receiver = 'HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA';
  const enc = new TextEncoder();
  const note = enc.encode('Hello World');
  const amount = 1000000;
  const sender = config.creatorAccount.addr;
  const params = await client.getTransactionParams().do();


  const txn1 = algosdk.makePaymentTxnWithSuggestedParams(
      sender,
      receiver,
      amount,
      undefined,
      undefined,
      params,
  );

  const txn2 = algosdk.makePaymentTxnWithSuggestedParams(
      sender,
      receiver,
      amount,
      undefined,
      undefined,
      params,
  );

  expect(base.assignGroups([txn1, txn2])).toBe(undefined);
  expect(txn1.group).toBeTruthy();
  expect(txn2.group).toBeTruthy();
});


test('getConstants', () => {
  expect(base.getConstants()).toBeTruthy();
});

test('getOrderBookId', () => {
  const algo = base.getOrderBookId(true);
  expect(algo).toBeTruthy();
  expect(typeof algo).toBe('number');
  const asa = base.getOrderBookId(false);
  expect(asa).toBeTruthy();
  expect(typeof asa).toBe('number');
});


test('executeOrder& marketOrder & structureOrder', async () => {
  // config, client, isSellingAsa, price, algoAmount, asaAmount, incluedMaker, walletConnector, shouldErr
  base.initSmartContracts('test');
  const client = base.initAlgodClient('test');
  const mockRawTransactions = new function(signed) {
    this.do = () => {
      return {txId: signed};
    };
  }();

  client.sendRawTransaction = jest.fn(() => mockRawTransactions);

  const axiosMock = jest.spyOn(axios, 'get').mockImplementation((addr) => {
    return new Promise((resolve, reject) => {
      resolve({

        txId: 'fakeId',
        status: 'confirmed',
        assets: [{'asset-id': config.assetId}],
        transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
      },
      );
    });
  });


  const buyLimitPrice = 2000;
  const buyOrderAssetAmount = 1000;
  const buyOrderAlgoAmount = 2000000;

  const sellLimitPrice = 1700;
  const sellOrderAssetAmount = 1000;
  const sellOrderAlgoAmount = 1700000;

  // Buy no Maker
  expect(await base.executeOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, allOrderBookOrders, false )).toBe(undefined);
  // expect(await base.structureOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, allOrderBookOrders, false )).toBeTruthy();

  // Buy with maker
  expect(await base.executeOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAssetAmount, 1000000, allOrderBookOrders, true )).toBe(undefined);
  // Buy with null orderbook
  expect(await base.executeOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, null, false )).toBe(undefined);

  //  Sell with no Maker
  //  expect(await algodex.executeOrder(client, true, config.assetId, testWallet, sellLimitPrice, sellOrderAssetAmount, sellOrderAlgoAmount, allOrderBookOrders, false )).toBe(undefined)

  // MarketOrder
  expect(await base.executeMarketOrder(client, false, config.assetId, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, allOrderBookOrders, false )).toBe(undefined);

  axiosMock.mockRestore();
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

test('signAndSendTransactions & signMyAlgo & propogateTransactions', async () => {
  base.initSmartContracts('test');
  const client = base.initAlgodClient('test');
  const mockRawTransactions = new function(signed) {
    this.do = () => {
      return {txId: true};
    };
  }();

  const params = await client.getTransactionParams().do();
  const receiver = 'HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA';
  const enc = new TextEncoder();
  const note = enc.encode('MockTransactions');
  const amount = 1000000;
  const sender = config.creatorAccount.addr;

  // need to create an LSIG for that doesnt require user sig.


  const txn1 = algosdk.makePaymentTxnWithSuggestedParams(
      sender,
      receiver,
      amount,
      undefined,
      note,
      params,
  );

  const txn2 = algosdk.makePaymentTxnWithSuggestedParams(
      sender,
      receiver,
      amount,
      undefined,
      undefined,
      params,
  );

  const transactions = [
    {
      unsignedTxn: txn1,
    },
    {
      unsignedTxn: txn2,
      needsUserSig: true,
    }];


  const axiosMock = jest.spyOn(axios, 'get').mockImplementation((addr) => {
    return new Promise((resolve, reject) => {
      resolve({

        txId: 'fakeId',
        status: 'confirmed',
        assets: [{'asset-id': config.assetId}],
        transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
      },
      );
    });
  });

  client.sendRawTransaction = jest.fn(() => mockRawTransactions);
  // const transactions = await transactionGenerator.getPlaceASAEscrowOrderTxns(config.client, config.creatorAccount, 1, 2, config.assetId, 10, true );


  expect(await base.signAndSendTransactions(client, transactions)).toBeTruthy();
  expect(await base.signMyAlgo(client, transactions)).toBeTruthy();
  expect(await base.propogateTransactions(client, transactions));

  axiosMock.mockRestore();
});

test('signAndSendWalletConnectTransactions', async () => {
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
  // const transactions = await transactionGenerator.getPlaceASAEscrowOrderTxns(config.client, config.creatorAccount, 1, 2, config.assetId, 10, true );
  const receiver = 'HZ57J3K46JIJXILONBBZOHX6BKPXEM2VVXNRFSUED6DKFD5ZD24PMJ3MVA';
  const enc = new TextEncoder();
  const note = enc.encode('MockTransactions');
  const amount = 1000000;
  const sender = config.creatorAccount.addr;


  const txn1 = algosdk.makePaymentTxnWithSuggestedParams(
      sender,
      receiver,
      amount,
      undefined,
      note,
      params,
  );

  const txn2 = algosdk.makePaymentTxnWithSuggestedParams(
      sender,
      receiver,
      amount,
      undefined,
      undefined,
      params,
  );

  const transactions = [txn1, txn2];
  transactions[1]['needsUserSig'] = true;


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

test('getMinWalletBalance', () => {
  const axiosMock = jest.spyOn(axios, 'get').mockImplementation((addr) => {
    return new Promise((resolve, reject) => {
      resolve({

        txId: 'fakeId',
        status: 'confirmed',
        assets: [{'asset-id': config.assetId}],
        transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
      },
      );
    });
  });
  expect(algodex.getMinWalletBalance('fakeaddress')).toBeTruthy();

  axiosMock.mockRestore();
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


test('getPlaceAlgosToBuyASAOrderIntoOrderbook', async () => {
  const client = base.initAlgodClient('test');

  expect(await base.getPlaceAlgosToBuyASAOrderIntoOrderbook(client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await base.getPlaceAlgosToBuyASAOrderIntoOrderbookV2(client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();


  // wallet that isn't empty
  // expect(await algodex.getPlaceAlgosToBuyASAOrderIntoOrderbook(client, testWallet, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await algodex.getPlaceAlgosToBuyASAOrderIntoOrderbookV2(client, testWallet, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
});

test('getPlaceASAToSellASAOrderIntoOrderbook', async () => {
  const client = base.initAlgodClient('test');

  expect(await base.getPlaceASAToSellASAOrderIntoOrderbook(client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
  // expect(await algodex.getPlaceASAToSellASAOrderIntoOrderbookV2(config.client, config.creatorAccount.addr, 1, 2, 0, config.assetId, 1, false)).toBeTruthy();
});


test('closeOrderFromOrderBookEntry', async () => {
  base.initSmartContracts('test');
  const client = base.initAlgodClient('test');


  const axiosMock = jest.spyOn(axios, 'get').mockImplementation((addr) => {
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

  const generatedOrderBookEntry = base.generateOrder(config.creatorAccount.addr, 2, 1, 0, config.assetId, false);

  try {
    await base.closeOrderFromOrderBookEntry(client, config.executorAccount.addr, config.creatorAccount.addr, generatedOrderBookEntry, 6);
  } catch (e) {
    expect(typeof e).toBe('string');
  }


  // expect(base.createOrderBookEntryObj(...args)).toBeTruthy();
  axiosMock.mockRestore();
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


test('closeOrderFromOrderBookEntry', async () => {
  base.initSmartContracts('test');
  const client = base.initAlgodClient('test');


  const axiosMock = jest.spyOn(axios, 'get').mockImplementation((addr) => {
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

  const generatedOrderBookEntry = base.generateOrder(config.creatorAccount.addr, 2, 1, 0, config.assetId, false);

  try {
    await base.closeOrderFromOrderBookEntry(client, config.executorAccount.addr, config.creatorAccount.addr, generatedOrderBookEntry, 6);
  } catch (e) {
    expect(typeof e).toBe('string');
  }
  axiosMock.mockRestore();
//    assetId returning null because you need to populate the test wallet to account for conditional on  665-668
// alternativeely mock this.getAccountInfo
});

