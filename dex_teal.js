/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
const AlgoOrderbookTeal = require('./lib/teal/dex_teal')

/**
 * Export of deprecated functions
 */
Object.keys(AlgoOrderbookTeal).forEach((key)=>{
    AlgoOrderbookTeal[key] = deprecate(AlgoOrderbookTeal[key], {file:'dex_teal.js'})
})
module.exports = AlgoOrderbookTeal;

