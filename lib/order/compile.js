const algosdk = require('algosdk');
const {compileLogicSig, compileDelegateTemplate} = require('../teal/compile');

/**
 * Compile Teal Order
 *
 * @param {Algodv2} client
 * @param {Order} order
 * @return {Promise<LogicSigAccount>}
 */
async function compile(client, order) {
  if (!(client instanceof algosdk.Algodv2)) {
    throw new TypeError('Invalid Algod Client!');
  }
  // TODO: Ensure Order

  return await compileLogicSig(
      client,
      compileDelegateTemplate(order),
  );
}

module.exports = compile;
