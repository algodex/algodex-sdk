it('should fix these tests', () => {
  const isBroken = true;
  expect(isBroken).toEqual(true);
});
const accountSetup = require('./accountSetup.js');
const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
const { timeout } = require('../../teal/utils');
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const executeASAEscrowOrderTest = require('./teal_tests/executeASAEscrowOrder');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const config = require('./TealConfig');
const takerAccountCleanup = require('./takerAccountCleanup');

//
describe('ASA ESCROW ORDER BOOK', () => {
  const asaAmount = 0.4;
  const price = 1.20;
  const executorAmount = 0.2;

  beforeAll(async () => {
    await accountSetup(config, 'sell', true, true);
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);
    await takerAccountCleanup(config, 'sell', executorAmount);
  }, JEST_MINUTE_TIMEOUT);

  test(
    'Place asa escrow order',
    async () => {
      const result = await placeASAOrderTest.runTest(config, asaAmount, price);
      expect(result).toBeTruthy();
      await timeout(4000);
    },
    JEST_MINUTE_TIMEOUT
  );

  test(
    'Partially execute asa escrow order (no opt-in txn)',
    async () => {
      const result = await executeASAEscrowOrderTest.runPartialExecTest(
        config,
        executorAmount,
        price
      );
      expect(result).toBeTruthy();
      await timeout(4000);
    },
    JEST_MINUTE_TIMEOUT
  );

  test(
    'Close asa escrow order',
    async () => {
      const result = await closeASAOrderTest.runTest(
        config,
        price,
        asaAmount - executorAmount
      );
      expect(result).toBeTruthy();
    },
    JEST_MINUTE_TIMEOUT
  );

  // test('Delete asa escrow order book', async () => {
  //   const result = await deleteAppTest.runTest(config);
  //   expect(result).toBeTruthy();
  // }, JEST_MINUTE_TIMEOUT);
});
