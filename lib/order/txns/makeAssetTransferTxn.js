/** @module order/txns */
const algosdk = require('algosdk');

/**
 * Asset Transfer Transaction
 *
 * @param {Order} order Algodex Order
 * @param {boolean} shouldClose Flag to close
 * @return {Transaction}
 * @ignore
 */
function makeAssetTransferTxn(order, shouldClose) {
  const {from, to, amount, asset: {id: assetId}, params} = order;
  // TODO: validate order
  if (typeof from !== 'string') {
    throw new TypeError('From must be a string!');
  }
  if (typeof to !== 'string') {
    throw new TypeError('To must be a string!');
  }
  // comment out the next two lines to use suggested fee
  params.fee = 1000;
  params.flatFee = true;

  let closeAddr = undefined;
  if (shouldClose === true) {
    // closeAddr = to; // This is wrong. V1 has closeOut going to escrowCreatorAddress
    closeAddr= order.escrowCreator;
  }

  return algosdk.makeAssetTransferTxnWithSuggestedParams(
      from,
      to,
      closeAddr,
      undefined,
      amount,
      undefined,
      assetId,
      params,
  );
}

module.exports = makeAssetTransferTxn;
