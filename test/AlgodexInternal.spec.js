const algodex = require('../algodex_internal_api.js')
const testWallet = 'DFV2MR2ILEZT5IVM6ZKJO34FTRROICPSRQYIRFK4DHEBDK7SQSA4NEVC2Q';
const indexerHost = 'algoindexer.testnet.algoexplorerapi.io';
const algodHost = 'node.testnet.algoexplorerapi.io';
const protocol = 'https:';
const transactionGenerator = require('../generate_transaction_types.js');
const algodexApi = require('../algodex_api.js');
const testHelper = require('../test_helper.js')
const algosdk = require('algosdk');
const CONSTANTS = require('../constants.js')
let algodServer = CONSTANTS.TEST_ALGOD_SERVER;
let port = CONSTANTS.TEST_ALGOD_PORT;
let token = CONSTANTS.TEST_ALGOD_TOKEN;
let emptyWallet = 'KDGKRDPA7KQBBJWF2JPQGKAM6JDO43JWZAK3SJOW25DAXNQBLRB3SKRULA'
const JEST_MINUTE_TIMEOUT = 60 * 1000

const internalTests = require('./integration_tests/AlgodexInternal.js')


const ALGO_ESCROW_ORDER_BOOK_ID = 18988007;
const ASA_ESCROW_ORDER_BOOK_ID = 18988134;

const config = {
   appId: -1,
   creatorAccount: testHelper.getRandomAccount(),
   executorAccount: testHelper.getRandomAccount(),
   openAccount: testHelper.getOpenAccount(),
   maliciousAccount: testHelper.getRandomAccount(),
   client: testHelper.getLocalClient(),
   assetId: 66711302,
 };


test('imported algodex is an object', () => {
   expect(typeof algodex).toBe('object');
});

test('setAlgodServer properly sets', () => {
   let response = algodex.setAlgodServer('test')

});


test('generateOrder function', () => {
   let params = [testWallet, 1000, 54, 0, 15322902]
   let incldMakerorder = algodex.generateOrder(...params)
   expect(incldMakerorder).toEqual(`${testWallet}-1000-54-0-15322902`)

   params.push(false);
   let noMakerOrder = algodex.generateOrder(...params)
   expect(noMakerOrder).toEqual(`1000-54-0-15322902`)
});

test('getAccountInfo function', async () => {
 
   let emptyAccountVal = {
      "address": emptyWallet,
      "amount": 0, "amount-without-pending-rewards": 0, "apps-local-state": [],
      "apps-total-schema": { "num-byte-slice": 0, "num-uint": 0 }, "assets": [],
      "created-apps": [], "created-assets": [], "pending-rewards": 0,
      "reward-base": 0, "rewards": 0, "round": -1, "status": "Offline"
   }
   let accountInfo = await algodex.getAccountInfo(testWallet);
   expect(typeof accountInfo).toBe('object');
   expect(accountInfo.amount > 0).toBe(true)
   let emptyAccount = await algodex.getAccountInfo(emptyWallet)
   expect(emptyAccount).toStrictEqual(emptyAccountVal)
   let nullAccount = await algodex.getAccountInfo(emptyWallet, false)
   expect(nullAccount).toBe(null)
  });

test('getQueuedTakerOrders function', async () => {
   let allOrderBookOrders = [
      {escrowOrderType : 'sell', price:2.33},
      {escrowOrderType : 'buy', price:2.03},
      {escrowOrderType : 'sell', price:2.80},
      {escrowOrderType : 'sell', price:2.64},
      {escrowOrderType : 'buy', price:1.97},
      {escrowOrderType : 'sell', price:2.63},
      {escrowOrderType : 'sell', price:2.22},
      {escrowOrderType : 'buy', price:1.89}
   ]
   let undefinedTakerOrders = algodex.getQueuedTakerOrders(testWallet, true, null)
   expect(undefinedTakerOrders).toEqual(undefined)
   let emptyTakerOrders = algodex.getQueuedTakerOrders(testWallet, true, [])
   expect(emptyTakerOrders).toEqual(undefined)
   let queuedBuyOrders = algodex.getQueuedTakerOrders(testWallet, false, allOrderBookOrders)
   expect(Array.isArray(queuedBuyOrders)).toBe(true)
   expect(queuedBuyOrders[0].escrowOrderType).toEqual('sell')
   expect(queuedBuyOrders[0].price).toEqual(2.22)

   let queuedSellOrders = algodex.getQueuedTakerOrders(testWallet, true, allOrderBookOrders)
   expect(queuedSellOrders[0].escrowOrderType).toEqual('buy')

   expect(queuedSellOrders[0].price).toEqual(2.03)
   


   
})

// test('initSmartContract', () => {
//    jest.spyOn(algodexApi, "initSmartContracts").mockReturnValue('d')
//    expect(algodexApi.initSmartContracts(-1, -1)).toBe('d')
// });

test('initAlgodClient properly sets', () => {
   let algodServer = CONSTANTS.LOCAL_ALGOD_SERVER;
   let port = CONSTANTS.LOCAL_ALGOD_PORT;
   let token = CONSTANTS.LOCAL_ALGOD_TOKEN;
   jest.spyOn(algodexApi, "initAlgodClient").mockReturnValue(new algosdk.Algodv2(token, algodServer, port))

});

test('createTransactionFromLsig', async () => {
   let response = await internalTests.createTransactionFromLsig(config, 2000, false)
   expect(response).toBeTruthy()

}, JEST_MINUTE_TIMEOUT)

// test(' getLsigFromProgramSource', async () => {

// })

test(' formatTransactionWithMetaData', async () => {

  let result = await internalTests.formatMetaData(config)
  expect(result).toBeTruthy()




})

