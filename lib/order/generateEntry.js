
/**
 *
 * @param {*} makerWalletAddr
 * @param {*} N
 * @param {*} D
 * @param {*} min
 * @param {*} assetId
 * @param {*} includeMakerAddr
 * @return {string}
 */
function generateEntry(
    makerWalletAddr,
    N,
    D,
    min,
    assetId,
    includeMakerAddr = true,
) {
  let rtn = N + '-' + D + '-' + min + '-' + assetId;
  if (includeMakerAddr) {
    rtn = makerWalletAddr + '-' + rtn;
  }
  console.debug('generateOrder final str is: ' + rtn);
  return rtn;
}

module.exports = generateEntry;
