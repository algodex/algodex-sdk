const config = require('./TealConfig');
const { timeout } = require('../../../lib/teal/utils');
const initCloseOrderAccounts = require('./initCloseOrderAccounts');
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
const accountSetup = require('./accountSetup.js');



describe('ASA ESCROW CANCEL', () => {
  const price = 1.2;
  const amount = 0.8;
  const note = `
  Testing: TealAsaEscrowCancel
  Open Account: ${config.openAccount.addr}
  Creator Account: ${config.creatorAccount.addr}
  
  Creator Account is buying ${amount} LAMPC at price: ${price} Algo
`

  // Create App
  beforeAll(async () => {
    // await accountSetup(config, "close")
    await accountSetup(config, 'sell', true, true, note); 

    await timeout(7000);
  }, JEST_MINUTE_TIMEOUT * 10);

  test(
    'Place asa escrow order',
    async () => {
      const result = await placeASAOrderTest.runTest(config, amount, price);
      expect(result).toBeTruthy();
      await timeout(4000);
    },
    JEST_MINUTE_TIMEOUT
  );

  test(
    'Close asa escrow order',
    async () => {
      const result = await closeASAOrderTest.runTest(config, price, amount);
      expect(result).toBeTruthy();
    },
    JEST_MINUTE_TIMEOUT * 2
  );

});
