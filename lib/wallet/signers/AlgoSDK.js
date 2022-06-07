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
