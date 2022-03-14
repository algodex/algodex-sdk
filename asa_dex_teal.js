/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
const obTemplate = require('./lib/teal/templates/ASA_Orderbook.teal')
const clearTemplate = require('./lib/teal/templates/ClearProgram.teal')
/**
 * Export of deprecated functions
 * @deprecated
 */
module.exports = {
    /**
     * @deprecated
     */
    getClearProgram: deprecate(()=>{
        return clearTemplate
    }),
    /**
     * @deprecated
     */
    getASAOrderBookApprovalProgram: deprecate(()=>{
        return obTemplate
    })
}
