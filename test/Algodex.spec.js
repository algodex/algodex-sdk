const algodex = require('../algodex_api.js')
const testWallet = 'DFV2MR2ILEZT5IVM6ZKJO34FTRROICPSRQYIRFK4DHEBDK7SQSA4NEVC2Q';
const indexerHost = 'algoindexer.testnet.algoexplorerapi.io';
const algodHost = 'node.testnet.algoexplorerapi.io';
const protocol = 'https:';
const transactionGenerator = require('../generate_transaction_types.js');
const algodexApi = require('../algodex_api.js');
const testHelper = require('../test_helper.js')
const algosdk = require('algosdk');
const CONSTANTS = require('../constants.js')
const orderBookEntry = require('./fixtures/allOrderBooks.js')
let emptyWallet = 'KDGKRDPA7KQBBJWF2JPQGKAM6JDO43JWZAK3SJOW25DAXNQBLRB3SKRULA'
const JEST_MINUTE_TIMEOUT = 60 * 1000
const algodexTests = require('./integration_tests/Algodex.js')



const ALGO_ESCROW_ORDER_BOOK_ID = 18988007;
const ASA_ESCROW_ORDER_BOOK_ID = 18988134;

const config = {
    appId: -1,
    creatorAccount: testHelper.getRandomAccount(),
    executorAccount: testHelper.getRandomAccount(),
    openAccount: testHelper.getOpenAccount(),
    maliciousAccount: testHelper.getRandomAccount(),
    client: testHelper.getLocalClient(),
    assetId: 15322902,
};


test('allSettled', async () => {
    let resolvedPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('always resolves');
        }, 300)
    })

    let rejectedPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            reject('always rejects');
        }, 300)
    })

    let promisesArr = [resolvedPromise, rejectedPromise]
    expect(await algodex.allSettled(promisesArr)).toBeTruthy();

})

test('initSmartContracts', () => {

    expect(algodex.initSmartContracts('local')).toBe(undefined)
    expect(algodex.initSmartContracts('test')).toBe(undefined)
    expect(algodex.initSmartContracts('public_test')).toBe(undefined)
    expect(algodex.initSmartContracts('production')).toBe(undefined)
    // expect(algodex.initSmartContracts('Error')).toThrow("environment must be local, test, or production")
})

test('initIndexer', () => {
    expect(algodex.initIndexer('local')).toBeTruthy()
    expect(algodex.initIndexer('test')).toBeTruthy()
    expect(algodex.initIndexer('public_test')).toBeTruthy()
    expect(algodex.initIndexer('production')).toBeTruthy()


})

test('initAlgodClient', () => {
    expect(algodex.initAlgodClient('local')).toBeTruthy()
    expect(algodex.initAlgodClient('test')).toBeTruthy()
    expect(algodex.initAlgodClient('public_test')).toBeTruthy()
    expect(algodex.initAlgodClient('production')).toBeTruthy()

})

test('getMinWalletBalance', () => {
    const accountInfoMock = jest.spyOn(algodex, "getAccountInfo").mockImplementation((addr) => {
        return {
            'address': 'FAKEADDR',
            'created-apps': [true, 'many', 'apps'],
            'assets': ['there', 'are', 'many', 'assets'],
            'apps-total-schema': {
                'num-uint': 4,
                'num-byte-slice': 3
            }
        }
    })
expect(algodex.getMinWalletBalance('fakeaddress')).toBeTruthy()

accountInfoMock.mockRestore()
})


test('createOrderBookEntryObject', () => {
    
    order = orderBookEntry[0]
    let args = []
    for(key in order) {
        args.push(order[key])
    }

    expect(algodex.createOrderBookEntryObj(...args)).toBeTruthy()
    // order.orderBookEntry, 15, 1, 15, 0, order.escrowAddr, order.algoBalance, order.asaBalance, 'sell', true, order.orderCreatorAddr, order.assetId, order.version
})

test('executeOrder', async () => {
    // config, client, isSellingAsa, price, algoAmount, asaAmount, incluedMaker, walletConnector, shouldErr

    let client = config.client
    let mockRawTransactions = new function (signed) {
        this.do = () => { return { txId: signed } }

    }()

    const waitForConfirmationMock = jest.spyOn(algodex, "waitForConfirmation").mockImplementation((txn) => {
       return new Promise((resolve, reject) => {
            resolve({
                data: {
                    txId: 'fakeId',
                    status: "confirmed",
                    statusMsg: `Transaction confirmed in round  fakeRound`,
                    transaction: { "amount": 'fake', "wallet": 'fake', "pool-error": [1, 2] }
                }
            })
        })


    })

    client.sendRawTransaction = jest.fn(() => mockRawTransactions)

    let buyLimitPrice = 2000
    let buyOrderAssetAmount = 1000
    let buyOrderAlgoAmount = 2000000
 
    let sellLimitPrice = 1700
    let sellOrderAssetAmount = 1000
    let sellOrderAlgoAmount = 1700000

    expect(await algodexTests.executeOrder(config, client, false, testWallet, buyLimitPrice, buyOrderAlgoAmount, buyOrderAssetAmount, false)).toBe(undefined)
    waitForConfirmationMock.mockRestore()

}, JEST_MINUTE_TIMEOUT)