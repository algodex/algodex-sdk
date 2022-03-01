const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const algodexApi = require('../../algodex_api.js')
const internalApi = require('../../algodex_internal_api.js')
const PRINT_TXNS = 0;
const CONSTANTS = require('../../constants.js');
const { generateOrder } = require('../../algodex_internal_api.js');
const allOrderBookOrders = require('../fixtures/allOrderBooks.js')

const InternalTests = {
    createTransactionFromLsig: async function (config, price, isEscrow,) {
        algodexApi.initSmartContracts('test')

        const client = config.client;
        const executorAccount = config.executorAccount;
        const creatorAccount = config.creatorAccount;
        const assetId = config.assetId;
        const lsig = await testHelper.getOrderLsig(client, creatorAccount, price, assetId, isEscrow)
        let generatedOrderEntry = algodexApi.generateOrder(config.creatorAccount.addr, 1, 2000, 0, config.assetId, true)
        const appId = generatedOrderEntry.split('-')[generatedOrderEntry.split('-').length - 1]

        let appArgs = [];
        var enc = new TextEncoder();
        appArgs.push(enc.encode("open"));
        appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
        appArgs.push(new Uint8Array([CONSTANTS.ESCROW_CONTRACT_VERSION]));

        const logicTxn = await internalApi.createTransactionFromLogicSig(config.client, lsig, Number(appId), appArgs, 'appOptIn')

        return logicTxn
    },
    formatMetaData: async function (config, orderType, currency) {
        algodexApi.initSmartContracts('test')
        let accountInfo = await algodexApi.getAccountInfo(config.creatorAccount.addr);

        let noteMetadata = {
            algoBalance: accountInfo.amount,
            asaBalance: (accountInfo.assets && accountInfo.assets.length > 0) ? accountInfo.assets[0].amount : 0,
            n: 1,
            d: 2,
            orderEntry: { assetId: config.assetId },
            assetId: config.assetId,
            version: 2,
            escrowAddr: 'DKGKRDPA7KQBBJWF2JPQGKAM6JDO43JWZAK3SJOW25DAXNQBLRB3SKRULA',
            escrowOrderType: "close",
            txType: "close",
            isASAescrow: true,
        }

        try {
            let payTxn = await transactionGenerator.getPlaceASAEscrowOrderTxns(config.client, config.creatorAccount, 1, 2, config.assetId, 10, true)


            let formattedTxn = internalApi.formatTransactionsWithMetadata(payTxn, config.creatorAccount, noteMetadata, orderType, currency);

            return formattedTxn

        } catch (error) {
            throw error
        }
    },
    getExecuteOrderTransactionsAsTakerFromOrderEntry: async function (config, isAsa) {
        // algodClient, orderBookEscrowEntry, takerCombOrderBalance, params, walletConnector
        //                 queuedOrder,       takerOrderBalance in AlgodexApi executeorder()
        //                  = queuedOrders[i]
        algodexApi.initSmartContracts('test')

        const client = config.client;
        let params = await client.getTransactionParams().do();

        if (isAsa) {
            const takerOrderBalance = {
                "asaBalance": 995.9999999999999,
                "algoBalance": 60680746,
                "walletAlgoBalance": 60680746,
                "walletASABalance": 8755,
                "limitPrice": 2000,
                "takerAddr": "4Z5ZYJXBT5OJH3HKHLBD3O7QNKG5T5YQL7CXIEN6XHDJPXYJMTHBKRU6EE",
                "walletMinBalance": 1500000,
                "takerIsOptedIn": true
            }


            return await internalApi.getExecuteOrderTransactionsAsTakerFromOrderEntry(client, allOrderBookOrders[0], takerOrderBalance, params)

        } else {

            const takerOrderBalance = {
                "asaBalance": 995.9999999999999,
                "algoBalance": 60680746,
                "walletAlgoBalance": 60680746,
                "walletASABalance": 8755,
                "limitPrice": 1700,
                "takerAddr": "4Z5ZYJXBT5OJH3HKHLBD3O7QNKG5T5YQL7CXIEN6XHDJPXYJMTHBKRU6EE",
                "walletMinBalance": 1500000,
                "takerIsOptedIn": true
            }


            return await internalApi.getExecuteOrderTransactionsAsTakerFromOrderEntry(client, allOrderBookOrders[4], takerOrderBalance, params)



        }


    },
}

module.exports = InternalTests