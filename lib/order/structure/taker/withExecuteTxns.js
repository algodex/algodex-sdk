const getExecuteTxns = require('./getExecuteTxns');

/**
 * Composed Get Execute Txns
 *
 * @param {Order} order A Executable Order
 * @param {boolean} withCloseout Execute as a Closeout
 * @return {Promise<Order>}
 * @ignore
 */
async function withExecuteTxns(order, withCloseout) {
  return {
    ...order,
    contract: {
      ...order.contract,
      txns: await getExecuteTxns(order, withCloseout),
    },
  };
}
module.exports = withExecuteTxns;
