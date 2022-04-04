// ///////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
// ///////////////////////////

const deprecate = require('./lib/utils/deprecate');
const obTemplate = require('./lib/order/teal/ASA_Orderbook.teal');
const clearTemplate = require('./lib/teal/ClearProgram.teal');
/**
 * Export of deprecated functions
 * @deprecated
 */
module.exports = {
  /**
     * @deprecated
     */
  getClearProgram: deprecate(()=>{
    return clearTemplate;
  }),
  /**
     * @deprecated
     */
  getASAOrderBookApprovalProgram: deprecate(()=>{
    return obTemplate;
  }),
};
