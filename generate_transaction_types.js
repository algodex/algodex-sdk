/////////////////////////////
// Alexander Trefonas      //
// 7/12/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
const GenerateTransactions = require('./lib/teal/Transactions.mjs')

const {
    compileProgram,
    getLsig,
    ApplicationClearStateTxn,
    CloseASAEscrowOrderTxns,
    PlaceASAEscrowOrderTxns,
    PlaceAlgoEscrowOrderTxns,
    ExecuteASAEscrowOrderTxns,
    AssetTransferTxn,
    PaymentTxn,
    ApplicationCreateTxn,
    ExecuteAlgoEscrowOrderTxns,
    CloseAlgoEscrowOrderTxns
} = GenerateTransactions

const mapToV1 = {
    /**
     * @deprecated
     */
    compileProgram,
    /**
     * @deprecated
     */
    getLsig,
    /**
     * @deprecated
     * @param args
     * @returns {Promise<Transaction>}
     */
    getAssetSendTxn: async (...args) => new AssetTransferTxn(...args),
    /**
     * @deprecated
     * @param args
     * @returns {Promise<Transaction>}
     */
    getPayTxn: async (...args) => new PaymentTxn(...args),
    /**
     * @deprecated
     * @param args
     * @returns {Promise<Transaction>}
     */
    getCreateAppTxn: async (...args) => new ApplicationCreateTxn(...args),

    /**
     * @deprecated
     * @param args
     * @returns {Promise<*[]>}
     */
    getCloseAlgoEscrowOrderTxns: async (...args) => new CloseAlgoEscrowOrderTxns(...args),
    /**
     * @deprecated
     * @param args
     * @returns {Promise<*[]>}
     */
    getCloseASAEscrowOrderTxns: async (...args) => new CloseASAEscrowOrderTxns(...args),
    /**
     * @deprecated
     * @param args
     * @returns {Promise<*[]>}
     */
    getPlaceAlgoEscrowOrderTxns: async (...args)=> new PlaceAlgoEscrowOrderTxns(...args),
    /**
     * @deprecated
     * @param args
     * @returns {Promise<*[]>}
     */
    getPlaceASAEscrowOrderTxns: async (...args)=> new PlaceASAEscrowOrderTxns(...args),
    /**
     * @deprecated
     * @param args
     * @returns {Promise<*[]>}
     */
    getExecuteASAEscrowOrderTxns: async (...args) => new ExecuteASAEscrowOrderTxns(...args),
    /**
     * @deprecated
     * @param args
     * @returns {Promise<*[]>}
     */
    getExecuteAlgoEscrowOrderTxns: async (...args) => new ExecuteAlgoEscrowOrderTxns(...args),

}

/**
 * Export of deprecated functions
 */
Object.keys(mapToV1).forEach((key)=>{
    mapToV1[key] = deprecate(mapToV1[key], {context: mapToV1, file:'generate_transaction_types.js'})
})
module.exports = mapToV1;

