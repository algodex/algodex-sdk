const { default: algosdk } = require("algosdk");
const order = require("../../order");

/**
 *
 */
function signer(orders) {
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

  outerTxns.forEach((txn) => {
    if (txn.lsig instanceof algosdk.LogicSigAccount){
        return {...txn,
            signedTxn: algosdk.signLogicSigTransactionObject(
                txn.unsignedTxn,
                txn.lsig,
            ),
          };
    }
  })

    // const groupedGroups = numberOfGroups.map(group => {


    //     const allTxFormatted = (groups[group].map(txn => {
    //         if (!txn.unsignedTxn.name ) {
    //             if (txn.unsignedTxn.type === "pay") {return algosdk.makePaymentTxnWithSuggestedParams(txn.unsignedTxn.from, txn.unsignedTxn.to, txn.unsignedTxn.amount, txn.unsignedTxn?.closeRemainderTo, undefined, params)}
    //             if (txn.unsignedTxn.type === "axfer") {return algosdk.makeAssetTransferTxnWithSuggestedParams(txn.unsignedTxn.from, txn.unsignedTxn.to, undefined, undefined, txn.unsignedTxn.amount, undefined, txn.unsignedTxn.assetIndex, params)}
    //         } else {
    //             return txn.unsignedTxn;
    //         }
    //     }))
    //     algosdk.assignGroupID(allTxFormatted.map(toSign => toSign));
    //     return allTxFormatted;
    // }
    // )

    const txnsToSign = groupedGroups.map(group => {
        const encodedGroup = group.map(txn => {
            const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
            if (algosdk.encodeAddress(txn.from.publicKey) !== walletConnector.connector.accounts[0]) return { txn: encodedTxn, signers: [] };
            return { txn: encodedTxn };
        })
        return encodedGroup;
    })
    
    const formattedTxn = txnsToSign.flat();

    const request = formatJsonRpcRequest("algo_signTxn", [formattedTxn]);
   
    const result = await walletConnector.connector.sendCustomRequest(request);
   

    let resultsFormattted = result.map((element, idx) => {
        return element ? {
            txID: formattedTxn[idx].txn,
            blob: new Uint8Array(Buffer.from(element, "base64"))
        } : {
            ...algosdk.signLogicSigTransactionObject(outerTxns[idx].unsignedTxn, outerTxns[idx].lsig)
        };
    });

}
module.exports = signer;
