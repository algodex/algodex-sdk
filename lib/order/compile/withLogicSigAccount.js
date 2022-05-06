const algosdk = require('algosdk');
const compileLogicSig = require('../../teal/compile/compileLogicSig.js');
const compileDelegateTemplate = require('./compileDelegateTemplate');
/**
 * ## [✏ With LogicSigAccount](#withLogicSigAccount)
 *
 * Compose an Order with its template and create a LogicSigAccount.
 *
 * @example
 * const res = await withLogicSigAccount(withUnits(order));
 * console.log(res.contract.lsig)
 * // Outputs LogicSigAccount
 *
 * @param {Order} o Algodex Order
 * @return {Promise.<Order>}
 * @memberOf module:order/compile
 */
async function withLogicSigAccount(o) {
  if (!(o?.client instanceof algosdk.Algodv2)) {
    throw new TypeError('Invalid Algod Client!');
  }
  const program = compileDelegateTemplate(o);
  const lsig = await compileLogicSig(
      o.client,
      program,
  );

  // Set Contract State
  return {
    ...o,
    contract: {
      ...o?.contract,
      lsig,
      escrow: o?.contract?.escrow || lsig.address(),
      program,
    },
  };
}

module.exports = withLogicSigAccount;
