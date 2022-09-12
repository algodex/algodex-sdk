const config = require('./TealConfig');
const { timeout } = require('../../../lib/teal/utils');
const initCloseOrderAccounts = require('./initCloseOrderAccounts');
const placeAlgoOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
const closeAlgoOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const accountSetup = require('./accountSetup.js');

describe('Algo ESCROW ORDER BOOK', () => {
  const price = 1.2;
  const amount = 0.8;

  beforeAll(async () => {
    await accountSetup(config, 'buy', true); 
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  // Create App
  test(
    'Place Algo Escrow Order',
    async () => {
      
      const result = await placeAlgoOrderTest.runTest(config, amount, price);
      expect(result).toBeTruthy();

      await timeout(7000);
    },
    JEST_MINUTE_TIMEOUT * 10
  );

  test(
    'Close Algo escrow order',
    async () => {
      const result = await closeAlgoOrderTest.runTest(config, price, amount);
      expect(result).toBeTruthy();
    },
    JEST_MINUTE_TIMEOUT * 2
  );
});
