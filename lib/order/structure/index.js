const structure = require('./structure');

structure.getTakerOrders = require('./getTakerOrders');
structure.getMakerTakerTxns = require('./getMakerTakerTxns');
structure.withMakerTxns = require('./maker/withMakerTxns');

module.exports = structure;

