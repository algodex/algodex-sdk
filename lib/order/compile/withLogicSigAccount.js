const algosdk = require('algosdk');
const {
  compileLogicSig,
  compileDelegateTemplate,
} = require('../../teal');
/**
 *
 * @param {Order} o Algodex Order
 * @return {Promise.<Order>}
 */
async function withLogicSigAccount(o) {
  if (!(o?.client instanceof algosdk.Algodv2)) {
    throw new TypeError('Invalid Algod Client!');
  }

  const lsig = await compileLogicSig(
      o.client,
      compileDelegateTemplate(o),
  );

  // Set Contract State
  return {
    ...o,
    contract: {
      ...o?.contract,
      lsig,
      escrow: lsig.address(),
    },
  };
}

module.exports = withLogicSigAccount;
