const testHelper = require('../../test_helper.js');
const transactionGenerator = require('../../generate_transaction_types.js');
const algosdk = require('algosdk');
const PRINT_TXNS = 0;

const InternalHelpers = {
    lsig: async function(config, price, isEscrow, ) {
       const lsig = await testHelper.getOrderLsig(config.client, config.creatorAccount.addr, price, config.assetId, isEscrow )
       return lsig
        
    }
}

module.exports = InternalHelpers