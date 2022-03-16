const algodex = require('./lib/AlgodexApi.js')
const deprecate = require('./lib/functions/deprecate.js')

let deprecatedFns = {}

Object.keys(algodex).forEach((key ) => {
    deprecatedFns[key] = deprecate(algodex[key], {context: algodex, file: 'algodex_api.js'} )
})

module.exports= deprecatedFns
