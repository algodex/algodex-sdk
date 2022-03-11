/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
const algoDelegateTemplate = require('./lib/teal/algo_delegate_template_teal')

/**
 * Export of deprecated functions
 */
Object.keys(algoDelegateTemplate).forEach((key)=>{
    algoDelegateTemplate[key] = deprecate(algoDelegateTemplate[key], {file:'algo_delegate_template_teal.js'})
})
module.exports = algoDelegateTemplate;
