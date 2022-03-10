/////////////////////////////
// Alexander Trefonas      //
// 7/12/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
const GenerateTransactions = require('./lib/teal/generate_transaction_types')

/**
 * Export of deprecated functions
 */
Object.keys(GenerateTransactions).forEach((key)=>{
    GenerateTransactions[key] = deprecate(GenerateTransactions[key], {context: GenerateTransactions, file:'generate_transaction_types.js'})
})
module.exports = GenerateTransactions;

