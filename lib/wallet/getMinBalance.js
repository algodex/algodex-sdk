// eslint-disable-next-line no-unused-vars
const algosdk = require('algosdk');
const {isUndefined} = require('lodash/lang');

/**
 * Get Minimum Amount
 *
 * Find the lowest amount for the wallet
 *
 * @param {Wallet} wallet Wallet to check
 * @return {number} Minimum Wallet Amount
 */
function getMinAmount(
    wallet,
) {
  console.debug('in getMinWalletBalance. Checking: ' + wallet.address);
  console.debug({wallet});

  let minAmount = 0;

  if (wallet['created-apps']) {
    minAmount += 100000 * (wallet['created-apps'].length); // Apps
  }
  if (wallet['assets']) {
    minAmount += wallet['assets'].length * 100000;
  }
  if (
    !isUndefined(wallet['apps-total-schema']) &&
    wallet['apps-total-schema']['num-uint']
  ) {
    // Total Ints
    minAmount += (25000+3500) * wallet['apps-total-schema']['num-uint'];
  }
  if (
    !isUndefined(wallet['apps-total-schema']) &&
    wallet['apps-total-schema']['num-byte-slice']
  ) {
    const numByteSlice = wallet['apps-total-schema']['num-byte-slice'];
    minAmount += (25000+25000) * numByteSlice; // Total Bytes
  }
  minAmount += 1000000;

  return minAmount;
}

module.exports = getMinAmount;
