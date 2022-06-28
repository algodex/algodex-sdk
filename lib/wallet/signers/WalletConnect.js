const {default: algosdk} = require('algosdk');
const {formatJsonRpcRequest} = require('@json-rpc-tools/utils');
const groupBy = require('../../utils/groupBy');

/**
 * WalletConnectSigner
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

  const encodedTxns = outerTxns.map((txn) => {
    const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn.unsignedTxn)).toString('base64');
    if (algosdk.encodeAddress(txn.unsignedTxn.from.publicKey) !== this.accounts[0]) return {txn: encodedTxn, signers: []}; // naive solution assuming target address is first item in accountds array
    return {txn: encodedTxn};
  });

  const request = formatJsonRpcRequest('algo_signTxn', [encodedTxns]);

  const result = await this.sendCustomRequest(request);


  const resultsFormatted = result.map((element, idx) => {
    return element ? {
      txID: encodedTxns[idx].txn,
      blob: new Uint8Array(Buffer.from(element, 'base64')),
    } : {
      ...algosdk.signLogicSigTransactionObject(outerTxns[idx].unsignedTxn, outerTxns[idx].lsig),
    };
  });

  const outerTxnsWithResults = outerTxns.map((txn, i) => {
    return {...txn, signedTxn: resultsFormatted[i]};
  });

  const signedTxnsObjGroupedByGroupNum = groupBy(outerTxnsWithResults, 'groupNum');

  return Object.values(signedTxnsObjGroupedByGroupNum);
}
module.exports = signer;
