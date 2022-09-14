const placeAlgoOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
const accountSetup = require('./accountSetup.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const config = require('./TealConfig');
const {timeout} = require('../../teal/utils');
const closeAlgoOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
const accountCleanup = require('./accountCleanup.js');
const generateAsset = require('./GenerateAsset');
const destroyAsset = require('./DestroyAsset');

describe('ALGO ESCROW PLACE NO OPT IN TXN', () => {
  const amount = 0.8;
  const price = 1.2;


  beforeAll(async () => {
    const assetId = await generateAsset(config.openAccount);
    console.log(assetId);
    const note = `
    Testing: TealAlgoEscrowPlaceNoOptInTxn
    assetId: ${assetId}
  
    Open Account: ${config.openAccount.addr}
    Creator Account: ${config.creatorAccount.addr}
  
    Creator Account is buying ${amount} LAMPC at price: ${price} Algo
  `;
    config.assetId = assetId;
    await accountSetup(config, 'buy', true, false, note); // optIn in the setUp phase to test sdk no optIn
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);
    await accountCleanup(config, 'buy', true);
    await destroyAsset(config.openAccount, config.assetId);
  }, JEST_MINUTE_TIMEOUT);

  test(
      'Place algo escrow order',
      async () => {
        const result = await placeAlgoOrderTest.runTest(config, amount, price);
        expect(result).toBeTruthy();
        await timeout(4000);
      },
      JEST_MINUTE_TIMEOUT,
  );

  test(
      'Close algo escrow order',
      async () => {
        await timeout(3000);
        const result = await closeAlgoOrderTest.runTest(config, price, amount);
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT,
  );
});
//
