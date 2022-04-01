/** @module teal/compile **/
const algosdk = require('algosdk');
const {isString} = require('lodash/lang');
const logger = require('pino')({
  prettyPrint: {
    levelFirst: true,
  },
});

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
 * Compilation Cache
 */
let compilationResults;

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

  if (typeof compilationResults === 'undefined') {
    compilationResults = {};
  }
  // Simple but effective hash function
  // https://stackoverflow.com/a/52171480
  const cyrb53 = function(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed; let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(
        h1 ^ (h1 >>> 16),
        2246822507,
    ) ^ Math.imul(
        h2 ^ (h2 >>> 13),
        3266489909,
    );

    h2 = Math.imul(
        h2 ^ (h2 >>> 16),
        2246822507,
    ) ^ Math.imul(
        h1 ^ (h1 >>> 13),
        3266489909,
    );
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  };

  const hashedProgram = cyrb53(program);
  logger.debug('hashed program: ' + hashedProgram);
  let compilationResult;
  if (hashedProgram in compilationResults) {
    compilationResult = compilationResults[hashedProgram];
    logger.debug('got compilation results from hash! ' + hashedProgram);
  } else {
    logger.debug('program not found in cache, fetching');
    compilationResult = await compileProgram(client, program);
    if (Object.keys(compilationResults).length > 200) {
      logger.debug('size is too large! resetting keys');
      compilationResults = {};
    }
    compilationResults[hashedProgram] = compilationResult;
  }

  const uintAr = Buffer.from(compilationResult, 'base64');
  const args = undefined;
  const lsig = new algosdk.LogicSigAccount(uintAr, args);
  logger.debug('lsig addr: ' + lsig.address());
  return lsig;
}

module.exports = {
  compileTemplate,
  compileProgram,
  compileLogicSig,
};
