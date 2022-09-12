it('should fix these tests', () => {
  const isBroken = true;
  expect(isBroken).toEqual(true);
});

const config = require('./TealConfig');
const { timeout } = require('../../../lib/teal/utils');
const initCloseOrderAccounts = require('./initCloseOrderAccounts');
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;

//
//
// const AlgodexApi = require('../algodex_api.js');
// const constants = require('../constants.js');
// const apiConfig = require('../../../../config.json');
// const {createApp} = require('../../test');
// const {transferFunds, deleteApplication, closeAccount} = require('../../../teal');
// const {getRandomAccount} = require('../../../teal/test');
// const JEST_MINUTE_TIMEOUT = 60 * 1000;
//
// const config = {
//   appId: -1,
//   creatorAccount: testHelper.getRandomAccount(),
//   executorAccount: testHelper.getRandomAccount(),
//   openAccount: testHelper.getOpenAccount(),
//   maliciousAccount: testHelper.getRandomAccount(),
//   client: testHelper.getLocalClient(),
//   assetId: 66711302,
// };
//
// console.log('DEBUG_SMART_CONTRACT_SOURCE is: ' + constants.DEBUG_SMART_CONTRACT_SOURCE);
//
// // TODO: The negative tests need to be implemented. The commented ones out are examples but will not work with
// // this transaction type.
// const negTests = [
//   /* {txnNum: 0, field: 'from', val: algosdk.decodeAddress(config.maliciousAccount.addr) },
//    {txnNum: 0, field: 'appArgs', innerNum: 0, val: textEncoder.encode('execute') },
//    {txnNum: 0, field: 'appIndex', configKeyForVal: 'fakeAppId' },
//    {txnNum: 0, field: 'appOnComplete', val: 0},
//    {txnNum: 1, field: 'from', val: algosdk.decodeAddress(config.maliciousAccount.addr) },
//    {txnNum: 1, field: 'closeRemainderTo', val: algosdk.decodeAddress(config.maliciousAccount.addr) },
//    {txnNum: 1, negTxn: {
//             unsignedTxnPromise: transactionGenerator.getAssetSendTxn(config.client, config.maliciousAccount.addr, config.maliciousAccount.addr,
//               1000, config.assetId, false),
//             senderAcct: config.maliciousAccount
//             }
//     },
//    {txnNum: 2, field: 'from', txnKeyForVal: 'from', txnNumForVal: 1}, //set to from escrow
//    {txnNum: 2, field: 'to', val: algosdk.decodeAddress(config.maliciousAccount.addr)},
//    {txnNum: 2, negTxn: {
//             unsignedTxnPromise: transactionGenerator.getPayTxn(config.client,
//             config.maliciousAccount.addr, config.maliciousAccount.addr,
//                 1000, false),
//             senderAcct: config.maliciousAccount
//         }
//     },*/
//
// ];
//
//
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
