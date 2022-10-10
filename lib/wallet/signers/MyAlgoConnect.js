/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const groupBy = require('../../utils/groupBy');
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

  const signedTxnsObjGroupedByGroupNum = groupBy(orderedSignedTxns, 'groupNum');

  return Object.values(signedTxnsObjGroupedByGroupNum);
}

module.exports = signer;
