/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
const asaDelegateTemplate = require('./lib/teal/ASA_delegate_template_teal_v6')

/**
 * Export of deprecated functions
 */
Object.keys(asaDelegateTemplate).forEach((key)=>{
    asaDelegateTemplate[key] = deprecate(asaDelegateTemplate[key], {file:'ASA_delegate_template_teal_v6.js'})
})
module.exports = asaDelegateTemplate;
