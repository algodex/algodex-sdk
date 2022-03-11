/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
const AsaOrderbookTeal = require('./lib/teal/asa_dex_teal')

/**
 * Export of deprecated functions
 */
Object.keys(AsaOrderbookTeal).forEach((key)=>{
    AsaOrderbookTeal[key] = deprecate(AsaOrderbookTeal[key], {file:'asa_dex_teal.js'})
})
module.exports = AsaOrderbookTeal;
