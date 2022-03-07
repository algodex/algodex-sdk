const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const algodexApi = require('../../algodex_api.js')
const internalApi = require('../../algodex_internal_api.js')
const PRINT_TXNS = 0;
const CONSTANTS = require('../../constants.js');
const { generateOrder } = require('../../algodex_internal_api.js');
const allOrderBookOrders = require('../fixtures/allOrderBooks.js')


const Test = {

    executeOrder: async function(config, client, isSellingAsa, addr, price, algoAmount, asaAmount, incluedMaker, walletConnector, shouldErr) {
        algodexApi.initSmartContracts('test')


        if(walletConnector){
            return  await algodexApi.executeOrder(client, isSellingAsa, config.assetId, addr, price, algoAmount, asaAmount, allOrderBookOrders, incluedMaker, walletConnector )     
        } else {
            return await algodexApi.executeOrder(client, isSellingAsa, config.assetId, addr, price, algoAmount, asaAmount, allOrderBookOrders, incluedMaker )
        }



        }
    }



module.exports = Test