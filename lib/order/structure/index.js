const structure = require('./structure');

structure.getTakerOrders = require('./getTakerOrders');
structure.getMakerTakerTxns = require('./getMakerTakerOrders');
structure.withMakerTxns = require('./maker/withMakerTxns');

module.exports = structure;

