

function makeConnector() {
  return {
    sign: function(outerTxns) {
      if ('something went wrong with creating sk') {
        outerTxns.map((txn)=>{
          return algosdk.signTransaction(txn.unsignedTxn, txn.senderAcct.sk);
        });
      }
    },
    connected: true,
  };
}

module.exports = makeConnector();
