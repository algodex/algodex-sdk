const config = require('./TealConfig');
const { timeout } = require('../../../lib/teal/utils');
const initCloseOrderAccounts = require('./initCloseOrderAccounts');
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;


describe('ASA ESCROW ORDER BOOK', () => {
  const price = 1.2;
  const amount = 0.8;

  // Create App
  beforeAll(async () => {
    // await accountSetup(config, "close")
    await initCloseOrderAccounts(config, 'sell', { amount, price });
    await timeout(7000);
  }, JEST_MINUTE_TIMEOUT * 10);

  test(
    'Close asa escrow order',
    async () => {
      const result = await closeASAOrderTest.runTest(config, price, amount);
      expect(result).toBeTruthy();
    },
    JEST_MINUTE_TIMEOUT * 2
  );

});
