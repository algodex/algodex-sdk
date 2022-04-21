/** @module order/structures **/
const structure = require('./structureRefreshed');
structure.getTakerOrderInformation = require('./getTakerOrderInformation');
structure.getStructuredTakerTxns = require('./getStructuredTakerTxns');
structure.withMakerTxns = require('./withMakerTxns');
module.exports = structure;

