/** @module teal/compile **/
const algosdk = require('algosdk');
const {isString} = require('lodash/lang');

/**
 * @typedef import('algosdk').Algodv2
 * @typedef import('algosdk').LogicSigAccount
 */

/**
 * Compiles a Teal Template
 *
 * @param {Object} data
 * @param {String} template
 * @return {string}
 */
function compileTemplate(data, template) {
  if (typeof data === 'undefined' || typeof data !== 'object') {
    throw new TypeError('Data must be an object!');
  }
  if (typeof template !== 'string') {
    throw new TypeError('Template must be a string!');
  }
  // Clone the template
  let res = `${template}`;
  // Apply data keys
  Object.keys(data).forEach((key)=>{
    res = res.split(`<${key}>`).join(data[key]);
  });
  // Return result
  return res;
}
/**
 * # 🏗 Compile Program
 *
 * helper function to compile program source
 *
 * @param {algosdk.Algodv2} client Algorand SDK Client
 * @param {string} program Program source
 * @return {Promise<Uint8Array>}
 */
async function compileProgram(client, program) {
  if (!(client instanceof algosdk.Algodv2)) {
    throw new TypeError('Invalid Algod Client!');
  }
  if (!isString(program)) {
    throw new TypeError('Invalid Program! Must be a string!');
  }
  const encoder = new TextEncoder();
  const programBytes = encoder.encode(program);
  const compileResponse = await client.compile(programBytes).do();

  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
}

/**
 * # 🏗 Compile Logic Signature
 *
 * @param {algosdk.Algodv2} client Algorand SDK Client
 * @param {string} program The smart contract
 * @return {Promise<algosdk.LogicSigAccount>}
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

module.exports = {
  compileTemplate,
  compileProgram,
  compileLogicSig,
};
