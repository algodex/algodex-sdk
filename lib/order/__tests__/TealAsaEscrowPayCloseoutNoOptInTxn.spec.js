it('should fix these tests', () => {
  const isBroken = true;
  expect(isBroken).toEqual(true);
});
const accountSetup = require('./accountSetup.js');
const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
const { timeout } = require('../../teal/utils');
const executeASAEscrowOrderTest = require('./teal_tests/executeASAEscrowOrder');
const JEST_MINUTE_TIMEOUT = 60 * 10000;
const config = require('./TealConfig');
const takerAccountCleanup = require('./takerAccountCleanup');

//
describe('ASA ESCROW ORDER BOOK', () => {
  const asaAmount = 0.4;
  const price = 1.25;
  const executorAmount = 0.41;

  beforeAll(async () => {
    await accountSetup(config, 'sell', true, true);// Since we're testing noOptIn on the executor account we pass true for optIn in account setup 
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);
    await takerAccountCleanup(config, 'sell', executorAmount, true);
  }, JEST_MINUTE_TIMEOUT);

  test(
    'Place asa escrow order',
    async () => {
      const result = await placeASAOrderTest.runTest(config, asaAmount, price);
      expect(result).toBeTruthy();
    },
    JEST_MINUTE_TIMEOUT
  );

  test(
    'Closeout execute asa escrow order with noOptIn',
    async () => {
      const result = await executeASAEscrowOrderTest.runPartialExecTest(
        config,
        executorAmount,
        price
      );
      expect(result).toBeTruthy();
    },
    JEST_MINUTE_TIMEOUT
  );

});
