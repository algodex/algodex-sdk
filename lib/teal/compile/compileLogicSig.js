const algosdk = require('algosdk');
const {isString} = require('lodash/lang');
const compileProgram = require('./compileProgram');
/**
 * ## 🏗 [Compile Logic Signature](#compileLogicSig)
 *
 * @param {algosdk.Algodv2} client Algorand SDK Client
 * @param {string} program The smart contract
 * @return {Promise<algosdk.LogicSigAccount>}
 * @memberOf module:teal/compile
 */
async function compileLogicSig(
    client,
    program,
) {
  if (!(client instanceof algosdk.Algodv2)) {
    throw new TypeError('Invalid Algod Client!');
  }
  if (!isString(program)) {
    throw new TypeError('Invalid Program! Must be a string!');
  }

  return new algosdk.LogicSigAccount(
      Buffer.from(
          await compileProgram(client, program),
          'base64',
      ),
      undefined,
  );
}

module.exports = compileLogicSig;
