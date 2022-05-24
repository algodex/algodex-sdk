const algosdk = require('algosdk');
const groupBy = (items, key) => items.reduce(
    (result, item) => ({
      ...result,
      [item[key]]: [
        ...(result[item[key]] || []),
        item,
      ],
    }),
    {},
);
/**
 *
 * @param {Array} txns
 */
function assignGroups(txns) {
  const groupID = algosdk.computeGroupID(txns);
  for (let i = 0; i < txns.length; i++) {
    txns[i].group = groupID;
  }
}
/**
 * @typedef import('@randlabs/myalgo-connect').MyAlgoConnect
 */

/**
 * MyAlgoConnect Signer
 *
 * @todo move to SDK
 * @param {Array<Order>} orders A list of Compiled Orders
 * @return {Promise<*>}
 */
async function signer(orders) {
  const orderTxns = orders.map((execObj) => execObj.contract.txns);
  orderTxns.forEach((outerTxns) => algosdk.assignGroupID(
      outerTxns.map((txn) => txn.unsignedTxn),
  ));
  const outerTxns = [];
  orderTxns.forEach((txns) => {
    txns.forEach((txn) => outerTxns.push(txn));
  });

  // Sign the lsig transactions
  const signedLsigs = outerTxns
      .filter((outerTxn) => outerTxn.lsig instanceof algosdk.LogicSigAccount)
      .map((outerTxn) => {
        return algosdk.signLogicSigTransactionObject(
            outerTxn.unsignedTxn,
            outerTxn.lsig,
        );
      });

  // Sign the user transactions
  // eslint-disable-next-line no-invalid-this
  const signedTxnsFromUser = await this.signTransaction(
      outerTxns
          .filter((outerTxn) => typeof outerTxn.senderAcct !== 'undefined')
          .map((outerTxn) => {
            return outerTxn.unsignedTxn.toByte();
          }),
  );

  return [...signedLsigs, ...signedTxnsFromUser]
      .map((txn) => ({signedTxn: txn}));
}

module.exports = signer;
