/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
module.exports = (orders, sk) => {
  const executableOrders = orders.map((execObj) => execObj.contract.txns.map((txn) => txn)); // don't need extra mapping
  executableOrders.forEach((txnArr) => algosdk.assignGroupID(txnArr.map((txn) => txn.unsignedTxn)));

  return executableOrders.map((txns) => {
    return txns.map((txn) => txn.lsig instanceof algosdk.LogicSigAccount ?
      algosdk.signLogicSigTransaction(txn.unsignedTxn, txn.lsig) :
      algosdk.signTransaction(txn.unsignedTxn, sk) )
    ;
  });
};
