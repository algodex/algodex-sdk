const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const algodexApi = require('../../algodex_api.js')
const internalApi = require('../../algodex_internal_api.js')
const PRINT_TXNS = 0;
const CONSTANTS = require('../../constants.js');
const { generateOrder } = require('../../algodex_internal_api.js');

const InternalTests = {
    createTransactionFromLsig: async function(config, price, isEscrow, ) {
        algodexApi.initSmartContracts('test')
    
        const client = config.client;
        const executorAccount = config.executorAccount;
        const creatorAccount = config.creatorAccount;
        const assetId = config.assetId;
        const lsig = await testHelper.getOrderLsig(client, creatorAccount, price, assetId, isEscrow )
        let generatedOrderEntry= algodexApi.generateOrder(config.creatorAccount.addr, 1, 2000, 0, config.assetId, true)
        const appId = generatedOrderEntry.split('-')[generatedOrderEntry.split('-').length -1 ]

        let appArgs = [];
        var enc = new TextEncoder();
        appArgs.push(enc.encode("open"));
        appArgs.push(enc.encode(generatedOrderEntry.slice(59)));
        appArgs.push(new Uint8Array([CONSTANTS.ESCROW_CONTRACT_VERSION]));
 
        const logicTxn = await internalApi.createTransactionFromLogicSig(config.client, lsig, Number(appId), appArgs, 'appOptIn')
 
        return logicTxn
    },
    formatMetaData: async function(config) {
        algodexApi.initSmartContracts('test')
        let accountInfo = await algodexApi.getAccountInfo(config.creatorAccount.addr);
        
        let noteMetadata = { 
           algoBalance: accountInfo.amount,
           asaBalance: (accountInfo.assets && accountInfo.assets.length > 0) ? accountInfo.assets[0].amount : 0,
           n: 1, 
           d: 2, 
           orderEntry: {assetId: config.assetId },
           assetId:config.assetId,
           version: 2,
           escrowAddr: 'DKGKRDPA7KQBBJWF2JPQGKAM6JDO43JWZAK3SJOW25DAXNQBLRB3SKRULA',
           escrowOrderType:"close",
           txType: "close",
           isASAescrow: true,
        }
       
     
        
        let payTxn = await transactionGenerator.getPlaceASAEscrowOrderTxns(config.client, config.creatorAccount, 1, 2, config.assetId, 10, true)
      
        console.debug(payTxn)
        let formattedTxn = internalApi.formatTransactionsWithMetadata(payTxn, config.creatorAccount, noteMetadata, 'close', 'asa');
        console.debug(formattedTxn)
        return formattedTxn
        
    }
}

module.exports = InternalTests