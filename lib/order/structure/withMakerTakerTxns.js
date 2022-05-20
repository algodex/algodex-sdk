const getMakerTakerTxns = require('./getMakerTakerTxns');

/**
 * Composed MakerTakerTxns transaction
 * @param {Order} order
 * @return {Promise<*>}
 */
async function withMakerTakerTxns(api, order) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await getMakerTakerTxns(api, order),
    },
  };
}

module.exports = withMakerTakerTxns;
