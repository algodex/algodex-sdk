const algosdk = require('algosdk');
const order = require('../../order');
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
  let txNum = 0; // txNum has to be assigned outside nested loop in order to preserve total order
  orderTxns.forEach((txns, groupNum) => {
    txns.forEach((txn) => {
      outerTxns.push({...txn, groupNum: groupNum, txNum: txNum});
      txNum++;
    });
  });

  // Sign the lsig transactions
  const signedLsigs = outerTxns
      .filter((outerTxn) => outerTxn.lsig instanceof algosdk.LogicSigAccount)
      .map((outerTxn) => {
        return {...outerTxn,
          signedTxn: algosdk.signLogicSigTransactionObject(
              outerTxn.unsignedTxn,
              outerTxn.lsig,
          ),
        };
      });

  // Sign the user transactions
  // eslint-disable-next-line no-invalid-this
  const userTxnsForSigning = outerTxns
      .filter((outerTxn) => typeof outerTxn.senderAcct !== 'undefined');
  const signedUserTxns = await this.signTransaction(
      userTxnsForSigning
          .map((outerTxn) => {
            return outerTxn.unsignedTxn.toByte();
          }),
  );
  const attachedUserSignedTxns = userTxnsForSigning.map( (txn, i) => {
    return {
      ...txn,
      signedTxn: signedUserTxns[i],
    };
  });

  const orderedSignedTxns = [...signedLsigs, ...attachedUserSignedTxns].sort((a, b) => a.txNum - b.txNum);
  return orderedSignedTxns;
}

module.exports = signer;
