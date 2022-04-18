const {groupBy} = require('../../functions/base');

module.exports = (outerTxns) => {
  const groups = groupBy(outerTxns, 'groupNum');
  const numberOfGroups = Object.keys(groups);
  const groupedGroups = numberOfGroups.map(
      (group) => {
        const allTxFormatted = (groups[group].map((txn) => {
          return txn;
        }));
        this.assignGroupID(allTxFormatted.map((toSign) => toSign.unsignedTxn));
        return allTxFormatted;
      },
  );

  const flatGroups = groupedGroups.flat();

  const signedTransactions = flatGroups.map((txn) => {
    return txn.lsig != null?
      this.signLogicSigTransaction(txn.unsignedTxn, txn.lsig) :
      this.signTransaction(txn.unsignedTxn, this.sk);
  });

  return outerTxns.map((txnObj, i) =>{
    txnObj.signedTxn = signedTransactions[i];
    return txnObj;
  });
};
