const algodex = require('../algodex_internal_api.js');
const testWallet = 'DFV2MR2ILEZT5IVM6ZKJO34FTRROICPSRQYIRFK4DHEBDK7SQSA4NEVC2Q';
const indexerHost = 'algoindexer.testnet.algoexplorerapi.io';
const algodHost = 'node.testnet.algoexplorerapi.io';
const protocol = 'https:';
const transactionGenerator = require('../generate_transaction_types.js');
const algodexApi = require('../algodex_api.js');
const testHelper = require('./setup.js');
const algosdk = require('algosdk');
const CONSTANTS = require('../constants.js');
const orderBookEntry = require('./fixtures/allOrderBooks.js');
const emptyWallet = 'KDGKRDPA7KQBBJWF2JPQGKAM6JDO43JWZAK3SJOW25DAXNQBLRB3SKRULA';
const JEST_MINUTE_TIMEOUT = 60 * 1000;

const internalTests = require('./integration_tests/AlgodexInternal.js');
const axios = require('axios').default;


const ALGO_ESCROW_ORDER_BOOK_ID = 18988007;
const ASA_ESCROW_ORDER_BOOK_ID = 18988134;

const config = {
  appId: -1,
  creatorAccount: testHelper.getRandomAccount(),
  executorAccount: testHelper.getRandomAccount(),
  openAccount: testHelper.getOpenAccount(),
  maliciousAccount: testHelper.getRandomAccount(),
  client: testHelper.getLocalClient(),
  assetId: 15322902,
};


test('generateOrder function', () => {
  const params = [testWallet, 1000, 54, 0, 15322902];
  const incldMakerorder = algodex.generateOrder(...params);
  expect(incldMakerorder).toEqual(`${testWallet}-1000-54-0-15322902`);

  params.push(false);
  const noMakerOrder = algodex.generateOrder(...params);
  expect(noMakerOrder).toEqual(`1000-54-0-15322902`);
});

test('getAccountInfo function', async () => {
  const emptyAccountVal = {
    'address': emptyWallet,
    'amount': 0, 'amount-without-pending-rewards': 0, 'apps-local-state': [],
    'apps-total-schema': {'num-byte-slice': 0, 'num-uint': 0}, 'assets': [],
    'created-apps': [], 'created-assets': [], 'pending-rewards': 0,
    'reward-base': 0, 'rewards': 0, 'round': -1, 'status': 'Offline',
  };
  const accountInfo = await algodex.getAccountInfo(testWallet);
  expect(typeof accountInfo).toBe('object');
  expect(accountInfo.amount > 0).toBe(true);
  const emptyAccount = await algodex.getAccountInfo(emptyWallet);
  expect(emptyAccount).toStrictEqual(emptyAccountVal);
  const nullAccount = await algodex.getAccountInfo(emptyWallet, false);
  expect(nullAccount).toBe(null);
});

test('getQueuedTakerOrders function', async () => {
  const allOrderBookOrders = [
    {escrowOrderType: 'sell', price: 2.33},
    {escrowOrderType: 'buy', price: 2.03},
    {escrowOrderType: 'sell', price: 2.80},
    {escrowOrderType: 'sell', price: 2.64},
    {escrowOrderType: 'buy', price: 1.97},
    {escrowOrderType: 'sell', price: 2.63},
    {escrowOrderType: 'sell', price: 2.22},
    {escrowOrderType: 'buy', price: 1.89},
  ];
  const undefinedTakerOrders = algodex.getQueuedTakerOrders(testWallet, true, null);
  expect(undefinedTakerOrders).toEqual(undefined);
  const emptyTakerOrders = algodex.getQueuedTakerOrders(testWallet, true, []);
  expect(emptyTakerOrders).toEqual(undefined);
  const queuedBuyOrders = algodex.getQueuedTakerOrders(testWallet, false, allOrderBookOrders);
  expect(Array.isArray(queuedBuyOrders)).toBe(true);
  expect(queuedBuyOrders[0].escrowOrderType).toEqual('sell');
  expect(queuedBuyOrders[0].price).toEqual(2.22);

  const queuedSellOrders = algodex.getQueuedTakerOrders(testWallet, true, allOrderBookOrders);
  expect(queuedSellOrders[0].escrowOrderType).toEqual('buy');

  expect(queuedSellOrders[0].price).toEqual(2.03);
});

// test('initSmartContract', () => {
//    jest.spyOn(algodexApi, "initSmartContracts").mockReturnValue('d')
//    expect(algodexApi.initSmartContracts(-1, -1)).toBe('d')
// });

test('initAlgodClient properly sets', () => {
  const algodServer = CONSTANTS.LOCAL_ALGOD_SERVER;
  const port = CONSTANTS.LOCAL_ALGOD_PORT;
  const token = CONSTANTS.LOCAL_ALGOD_TOKEN;
  jest.spyOn(algodexApi, 'initAlgodClient').mockReturnValue(new algosdk.Algodv2(token, algodServer, port));
});

test('createTransactionFromLsig', async () => {
  const optIn = await internalTests.createTransactionFromLsig(config, 2000, false, true);
  expect(optIn).toBeTruthy();
  const noOptIn = await internalTests.createTransactionFromLsig(config, 2000, false, false);
  expect(noOptIn).toBeTruthy();
}, JEST_MINUTE_TIMEOUT);

// test(' getLsigFromProgramSource', async () => {

// })

test('waitForConfirmation', async () => {
  algodexApi.initSmartContracts('test');
  const successCase = jest.spyOn(axios, 'get').mockImplementation((url ) => {
    if (url) {
      return Promise.resolve({
        data: {
          txId: 'fakeId',
          status: 'confirmed',
          statusMsg: `Transaction confirmed in round  fakeRound`,
          transaction: {'amount': 'fake', 'wallet': 'fake', 'confirmed-round': 2},
        },
      });
    } else {
      throw new Error('Url was not passed into Axios request in waitForConfirmation fn()');
    }
  });

  expect(await algodex.waitForConfirmation('fakeTxId')).toBeTruthy();
  successCase.mockRestore();
  const poolErrorCase = jest.spyOn(axios, 'get').mockImplementation((url ) => {
    if (url) {
      return Promise.resolve({
        data: {
          txId: 'fakeId',
          status: 'confirmed',
          statusMsg: `Transaction confirmed in round  fakeRound`,
          transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
        },
      });
    } else {
      throw new Error('Url was not passed into Axios request in waitForConfirmation fn()');
    }
  });
  expect(await algodex.waitForConfirmation('fakeTxId')).toBeTruthy();
  poolErrorCase.mockRestore();
}, JEST_MINUTE_TIMEOUT);

test('printTransactionDebug', async () => {
  algodexApi.initSmartContracts('test');

  const mockedBuffer = jest.spyOn(Buffer, 'concat').mockImplementation((signedTxns ) => {
    if (signedTxns) {
      return 'fakeBufferCalled';
    } else {
      throw new Error('Url was not passed into Axios request in printTransactionDebug fn()');
    }
  });


  const mockedAxios = jest.spyOn(axios, 'post').mockImplementation((url ) => {
    if (url) {
      return Promise.resolve({
        data: {
          name: 'fakedPost response for transaction debug',
          transaction: {'amount': 'fake', 'wallet': 'fake', 'pool-error': [1, 2]},
        },
      });
    } else {
      throw new Error('Url was not passed into Axios post request in printTransactionDebug fn()');
    }
  });

  process.env.NEXT_PUBLIC_DEBUG_SMART_CONTRACT_SOURCE = '1';
  process.env.ALGODEX_INFO_HOST = 'notempty';

  // const constantDebugMock = jest.spyOn(CONSTANTS, "DEBUG_SMART_CONTRACT_SOURCE").mockImplementation(() => 1)

  expect(algodex.printTransactionDebug(['signedTxns', 'faked'])).toBe(undefined);

  process.env.DEBUG_SMART_CONTRACT_SOURCE = undefined;
  process.env.ALGODEX_INFO_HOST = undefined;

  // above mock isn't working. I may have to mock entire constants module.


  mockedBuffer.mockRestore();
  mockedAxios.mockRestore();
  // constantDebugMock.mockRestore();
}, JEST_MINUTE_TIMEOUT);


test(' formatTransactionWithMetaData', async () => {
  const result = await internalTests.formatMetaData(config, 'close', 'asa');
  expect(result).toBeTruthy();
  console.log(result);
  // console.log(await internalTests.formatMetaData(config, 'error', 'asa'))
  expect(result[0]['note']).toBeTruthy();
});

test('getExecuteOrderTransactionsAsTakerFromOrderEntry', async () => {
  const asaResult = await internalTests.getExecuteOrderTransactionsAsTakerFromOrderEntry(config, true);

  expect(asaResult).toBeTruthy();
  const algoResult = await internalTests.getExecuteOrderTransactionsAsTakerFromOrderEntry(config, false);

  expect(algoResult).toBeTruthy();

  const walletConnector={connector: {connected: true}};

  const walletConnectorAsaResult = await internalTests.getExecuteOrderTransactionsAsTakerFromOrderEntry(config, true, false, walletConnector );
  expect(walletConnectorAsaResult).toBeTruthy();

  const walletConnectorAlgoResult = await internalTests.getExecuteOrderTransactionsAsTakerFromOrderEntry(config, false, false, walletConnector );
  expect(walletConnectorAlgoResult).toBeTruthy();

  try {
    await internalTests.getExecuteOrderTransactionsAsTakerFromOrderEntry(config, false, true);
    // error for algoOrders
  } catch (e) {
    expect(e.message).toBe('client.compile is not a function');
  }


  try {
    await internalTests.getExecuteOrderTransactionsAsTakerFromOrderEntry(config, true, true);
    // error for AsaOrders
  } catch (e) {
    expect(e.message).toBe('client.compile is not a function');
  }
}, JEST_MINUTE_TIMEOUT);
// expect(await internalTests.getExecuteOrderTransactionsAsTakerFromOrderEntry(config, true, true)).toThrow("client.compile is not a function")


test('doAlertInternal', () => {
  const jsdomAlert = global.alert;
  global.alert = () => { };
  expect(algodex.doAlertInternal()).toBe(undefined);
  global.alert = jsdomAlert;
});

test('getExecuteASAOrderTakerTxnAmounts', () => {
  const takerOrderBalance = {
    'asaBalance': 995.9999999999999,
    'algoBalance': 11030,
    'walletAlgoBalance': 11030,
    'walletASABalance': 8755,
    'limitPrice': 2000,
    'takerAddr': '4Z5ZYJXBT5OJH3HKHLBD3O7QNKG5T5YQL7CXIEN6XHDJPXYJMTHBKRU6EE',
    'walletMinBalance': 1500000,
    'takerIsOptedIn': true,
  };
  const asaAmountLargerResult = algodex.getExecuteASAOrderTakerTxnAmounts(takerOrderBalance, orderBookEntry[0]);
  expect(asaAmountLargerResult).toBeTruthy();
  const orderBookEntryWithZero= {...orderBookEntry[0], asaBalance: .001};

  const escrowAsaAmountZero = algodex.getExecuteASAOrderTakerTxnAmounts(takerOrderBalance, orderBookEntryWithZero);
  expect(escrowAsaAmountZero).toBeTruthy();
});


test('buildDelegateTemplateFromArgs', () => {
  const {n, d, isAsaEscrow, orderCreatorAddr, assetId} = orderBookEntry[0];


  const asaV6= algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, true, 6);
  expect(asaV6).toBeTruthy();
  const asaV5 = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, true, 5);
  expect(asaV5).toBeTruthy();
  const asaV4 = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, true, 4);
  expect(asaV4).toBeTruthy();
  const asaV3 = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, true, 3);
  expect(asaV3).toBeTruthy();

  const algoV6= algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, false, 6);
  expect(algoV6).toBeTruthy();
  const algoV5 = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, false, 5);
  expect(algoV5).toBeTruthy();
  const algoV4 = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, false, 4);
  expect(algoV4).toBeTruthy();
  const algoV3 = algodex.buildDelegateTemplateFromArgs(0, assetId, n, d, orderCreatorAddr, false, 3);
  expect(algoV3).toBeTruthy();

  try {
    expect(algodex.buildDelegateTemplateFromArgs('error', assetId, n, d, orderCreatorAddr, isAsaEscrow, 2)).toBe(null);
    // error for AsaOrders
  } catch (e) {
    expect(e).toBe('one or more null arguments in buildDelegateTemplateFromArgs!');
  }
});

test('closeOrder', async () => {
  const client = config.client;
  const mockRawTransactions= new function(signed) {
    this.do = () => {
      return {txId: signed};
    };
  }();
  client.sendRawTransaction = jest.fn(() => mockRawTransactions);

  algodex.waitForConfirmation= jest.fn((txId) => true);
  algodex.printTransactionDebug = jest.fn(() => console.debug('mockedTransactionDebug'));
  expect(await internalTests.closeOrder(client, config)).toBeTruthy();
}, JEST_MINUTE_TIMEOUT);


test('closeASAOrder', async () => {
  const client = config.client;
  const mockRawTransactions= new function(signed) {
    this.do = () => {
      return {txId: signed};
    };
  }();
  client.sendRawTransaction = jest.fn(() => mockRawTransactions);

  algodex.waitForConfirmation= jest.fn((txId) => true);
  algodex.printTransactionDebug = jest.fn(() => console.debug('mockedTransactionDebug'));
  expect(await internalTests.closeASAOrder(client, config)).toBeTruthy();
}, JEST_MINUTE_TIMEOUT);

test('imported algodex is an object', () => {
  expect(typeof algodex).toBe('object');
});

test('setAlgodServer properly sets', () => {
  const response = algodex.setAlgodServer('test');
});
test('setAlgodToken properly sets', () => {
  const response = algodex.setAlgodToken('test');
});
test('setAlgodIndexer properly sets', () => {
  const response = algodex.setAlgodIndexer('test');
});
test('setAlgodPort properly sets', () => {
  const response = algodex.setAlgodPort('test');
});
