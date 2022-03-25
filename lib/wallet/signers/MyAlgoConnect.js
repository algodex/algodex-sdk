const {groupBy, assignGroups} = require('../../functions/base');
const algosdk = require('algosdk');

/**
 * @typedef import('@randlabs/myalgo-connect').MyAlgoConnect
 */

/**
 * @implements MyAlgoConnect
 * @param {Array} outerTxns
 * @return {Promise<*>}
 */
async function signer(outerTxns) {
  console.debug('inside signMyAlgoTransactions transactions');
  const groups = groupBy(outerTxns, 'groupNum');

  const numberOfGroups = Object.keys(groups);

  const groupedGroups = numberOfGroups.map((group) => {
    const allTxFormatted = (groups[group].map((txn) => {
      return txn.unsignedTxn;
    }));
    assignGroups(allTxFormatted);
    return allTxFormatted;
  },
  );


  const flattenedGroups = groupedGroups.flat();

  const txnsForSig = [];

  for (let i = 0; i < outerTxns.length; i++) {
    outerTxns[i].unsignedTxn = flattenedGroups[i];
    if (outerTxns[i].needsUserSig == true) {
      txnsForSig.push(flattenedGroups[i]);
    }
  }

  const signedTxnsFromUser = await this.signTransaction(txnsForSig);

  if (Array.isArray(signedTxnsFromUser)) {
    let userSigIndex = 0;
    for (let i = 0; i < outerTxns.length; i++) {
      if (outerTxns[i].needsUserSig) {
        outerTxns[i].signedTxn = signedTxnsFromUser[userSigIndex].blob;
        userSigIndex++;
      }
    }
  } else {
    for (let i = 0; i < outerTxns.length; i++) {
      if (outerTxns[i].needsUserSig) {
        outerTxns[i].signedTxn = signedTxnsFromUser.blob;
        break;
      }
    }
  }

  for (let i = 0; i < outerTxns.length; i++) {
    if (!outerTxns[i].needsUserSig) {
      const signedLsig = await algosdk.signLogicSigTransactionObject(outerTxns[i].unsignedTxn, outerTxns[i].lsig);
      outerTxns[i].signedTxn = signedLsig.blob;
    }
  }
  return outerTxns;
}
