const algosdk = require('algosdk');
const teal = require('@algodex/algodex-teal');
/**
 * order.makeAssetTransferTxn
 *
 * @param {Order} order
 * @param {string} [closeToRemainder] string representation of Algorand address - if provided, send all remaining
 *     assets after transfer to the “closeRemainderTo” address
 * @param {string} [revocationTarget] string representation of Algorand address - if provided, and if “from” is the
 *     asset's revocation manager, then deduct from “revocationTarget” rather than “from”
 * @param {Uint8Array} [note] uint8array of arbitrary data for sender to store
 * @param {string} [rekeyTo] ekeyTo address, optional
 * @return {Promise<Transaction>}
 * @ignore
 */
async function makeAssetTransferTxn(order, closeToRemainder, revocationTarget, note, rekeyTo) {
  if (typeof order?.contract?.from === 'undefined' || typeof order?.contract?.to === 'undefined') {
    throw new TypeError('Invalid contract state!');
  }

  // TODO: Optional Params introspection when they are defined

  // Side-load Suggested Params
  const _suggestedParams = await teal.getTransactionParams(order.client, order?.contract?.params, true);

  return algosdk.makeAssetTransferTxnWithSuggestedParams(
      order.contract.from,
      order.contract.to,
      closeToRemainder,
      revocationTarget,
      order.contract.amount,
      note,
      order.asset.id,
      _suggestedParams,
      rekeyTo,
  );
}

module.exports = makeAssetTransferTxn;
