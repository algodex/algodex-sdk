/////////////////////////////
// Alexander Trefonas      //
// 7/9/2021                //
// Copyright Algodev Inc   //
// All Rights Reserved.    //
/////////////////////////////

const deprecate = require('./lib/functions/deprecate');
const template = require('./lib/teal/templates/ALGO_Delegate_v4.template.teal')

/**
 * Export of deprecated functions
 * @deprecated
 */
module.exports = {
    /**
     * @deprecated
     */
    getTealTemplate: deprecate(()=>{
      return template
    })
}

