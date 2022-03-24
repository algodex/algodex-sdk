const algodex = require('../index.js');
const testWallet = 'DFV2MR2ILEZT5IVM6ZKJO34FTRROICPSRQYIRFK4DHEBDK7SQSA4NEVC2Q';
const fakeTxId = 'IQZEYXX74V4XSOG6NWXMBG6QA74A5MHKF62DL4BIVF7QLQI5HLFQ';
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const orderBookEntry = require('./fixtures/allOrderBooks.js');

test('imported algodex is an object', () => {
  expect(typeof algodex).toBe('object');
});

test('getSmartContractVersions is a function', () => {
  expect(typeof algodex.getSmartContractVersions).toBe('function');
});

test('getSmartContractVersions returns an object with properties that are numbers', () => {
  const response = algodex.getSmartContractVersions();
  expect(typeof response.escrowContractVersion).toBe('number');
  expect(typeof response.orderBookContractVersion).toBe('number');
});

test('getAsaOrderbookTeal is a function', () => {
  expect(typeof algodex.getAsaOrderBookTeal).toBe('function');
});

test('getConstants', () => {
  expect(algodex.getConstants()).toBeTruthy();
});

test('initSmartContracts', () => {
  expect(algodex.initSmartContracts('test')).toBe(undefined);
});

test('waitForConfirmation', async () => {
  expect(await algodex.waitForConfirmation(fakeTxId)).toBeTruthy();
}, JEST_MINUTE_TIMEOUT );

test('printTransactionDebug', () => {
  algodex.initSmartContracts('test');
  const fakeSignedTxns = ['fakeTXns', 'to be converted', 'to buffer for debug'];

  expect( algodex.printTransactionDebug(fakeSignedTxns)).toBe(undefined);
} );

test('createOrderBookEntryObj', () => {
  order = orderBookEntry[0];
  const args = [];
  // eslint-disable-next-line guard-for-in
  for (key in order) {
    args.push(order[key]);
  }

  expect(algodex.createOrderBookEntryObj(...args)).toBeTruthy();
});
test('getAsaOrderbookTeal returns a string', () => {
  const response = algodex.getAsaOrderBookTeal();
  expect(typeof response).toBe('string');
});

test('getAlgoOrderbookTeal is a function', () => {
  expect(typeof algodex.getAlgoOrderBookTeal).toBe('function');
});

test('getAlgoOrderbookTeal returns a string', () => {
  const response = algodex.getAlgoOrderBookTeal();
  expect(typeof response).toBe('string');
});

test('getOrderBookId is a function', () => {
  expect(typeof algodex.getOrderBookId).toBe('function');
});

test('getOrderBookId returns the properId', () => {
  expect(algodex.getOrderBookId(true)).toEqual(16021155);
  expect(algodex.getOrderBookId(false)).toEqual(16021157);
});

test('printMsg is a function', () => {
  expect(typeof algodex.printMsg).toBe('function');
});

test('printMsg returns a string', () => {
  const response = algodex.printMsg();
  expect(typeof response).toBe('string');
});

test('getConstants is a function', () => {
  expect(typeof algodex.getConstants).toBe('function');
});

test('initSmartContract is a function', () => {
  expect(typeof algodex.initSmartContracts).toBe('function');
});

test('initIndexer is a function', () => {
  expect(typeof algodex.initIndexer).toBe('function');
});

test('initIndexer outputs object with correct properties', () => {
  const response = algodex.initIndexer('local');
  expect(typeof response).toBe('object');
  expect(typeof response.c).toBe('object');
  expect(response.intDecoding).toBe('default');
});

test('initAlgodClient is a function', () => {
  expect(typeof algodex.initAlgodClient).toBe('function');
});

test('initAlgodClient outputs object with correct properties', () => {
  const response = algodex.initAlgodClient('local');
  expect(typeof response).toBe('object');
  expect(typeof response.c).toBe('object');
});

test('waitForConfirmation is a function', () => {
  expect(typeof algodex.waitForConfirmation).toBe('function');
});

test('getMinWalletBalance is a function', () => {
  expect(typeof algodex.getMinWalletBalance).toBe('function');
});

test('getminWalletBalance outputs number', async () => {
  const response = await algodex.getMinWalletBalance(testWallet);
  expect(typeof response).toBe('number');
});

test('getAccountInfo is a function', () => {
  expect(typeof algodex.getAccountInfo).toBe('function');
});

test('getAccountInfo returns and object with the correct properties', async () => {
  const response = await algodex.getAccountInfo(testWallet);
  expect(typeof response).toBe('object');
  expect(typeof response.address).toBe('string');
  expect(typeof response.amount).toBe('number');
  expect(typeof response['amount-without-pending-rewards']).toBe('number');
  expect(Array.isArray(response.assets)).toBe(true);
  expect(typeof response['pending-rewards']).toBe('number');
  expect(typeof response['reward-base']).toBe('number');
  expect(typeof response.rewards).toBe('number');
  expect(typeof response.round).toBe('number');
  expect(typeof response.status).toBe('string');
});

test('getNumeratorAndDenominatorFromPrice is a function', () => {
  expect(typeof algodex.getNumeratorAndDenominatorFromPrice).toBe('function');
});

test('getNumeratorAndDenominatorFromPrice returns the correct numerator and denominator', () => {
  const response = algodex.getNumeratorAndDenominatorFromPrice(1.6);
  expect(typeof response).toBe('object');
  expect(typeof response.n).toBe('number');
  expect(typeof response.d).toBe('number');
  expect(response.d / response.n).toBe(1.6);
});
