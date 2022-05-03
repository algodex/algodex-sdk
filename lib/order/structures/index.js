/** @module order/structures **/
const structure = require('./structure');

structure.getTakerOrderInformation = require('./getTakerOrderInformation');
structure.getStructuredTakerTxns = require('./getStructuredTakerTxns');
structure.withMakerTxns = require('./withMakerTxns');

module.exports = structure;

