it('should fix these tests', () => {
  const isBroken = true;
  expect(isBroken).toEqual(true);
});
const accountSetup = require('./accountSetup.js');
const placeAlgoOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
const {timeout} = require('../../teal/utils');
const closeAlgoOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
const executeAlgoEscrowOrderTest = require('./teal_tests/executeAlgoEscrowOrder');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const config = require('./TealConfig');
const takerAccountCleanup = require('./takerAccountCleanup');

//
describe('Algo ESCROW ORDER BOOK', () => {
  const asaAmount = 0.4;
  const price = 1.25;
  const executorAmount = 0.2;

  beforeAll(async () => {
    await accountSetup(config, 'buy', true, true);
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);
    await takerAccountCleanup(config, 'buy', executorAmount);
  }, JEST_MINUTE_TIMEOUT);

  test(
      'Place Algo escrow order',
      async () => {
      // set up the Algo Escrow to be executed
        const result = await placeAlgoOrderTest.runTest(config, asaAmount, price);
        expect(result).toBeTruthy();
        await timeout(4000);
      },
      JEST_MINUTE_TIMEOUT,
  );

  test(
      'Partially execute algo escrow order (no opt-in txn)',
      async () => {
        const result = await executeAlgoEscrowOrderTest.runPartialExecTest(
            config,
            executorAmount,
            price,
        );
        expect(result).toBeTruthy();
        await timeout(4000);
      },
      JEST_MINUTE_TIMEOUT,
  );

  test(
      'Close algo escrow order',
      async () => {
        const result = await closeAlgoOrderTest.runTest(
            config,
            price,
            asaAmount - executorAmount,
        );
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT,
  );

  // test('Delete asa escrow order book', async () => {
  //   const result = await deleteAppTest.runTest(config);
  //   expect(result).toBeTruthy();
  // }, JEST_MINUTE_TIMEOUT);
});
