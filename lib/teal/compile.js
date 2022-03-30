/** @module teal/compile **/
const algosdk = require('algosdk');
const {isString, isUndefined} = require('lodash/lang');
const logger = require('pino')({
  prettyPrint: {
    levelFirst: true,
  },
});

const algoDelegateTemplateV7 = require('../teal/templates/ALGO_Delegate_v7.template.teal');
const algoDelegateTemplateV6 = require('../teal/templates/ALGO_Delegate_v6.template.teal');
const algoDelegateTemplateV5 = require('../teal/templates/ALGO_Delegate_v5.template.teal');
const algoDelegateTemplateV4 = require('../teal/templates/ALGO_Delegate_v4.template.teal');
const algoDelegateTemplate = require('../teal/templates/ALGO_Delegate.template.teal');
const asaDelegateTemplate = require('../teal/templates/ASA_Delegate.template.teal');
const asaDelegateTemplateV6 = require('../teal/templates/ASA_Delegate_v6.template.teal');
const asaDelegateTemplateV5 = require('../teal/templates/ASA_Delegate_v5.template.teal');
const asaDelegateTemplateV4 = require('../teal/templates/ASA_Delegate_v4.template.teal');


/**
 * @typedef import('algosdk').Algodv2
 * @typedef import('algosdk').LogicSigAccount
 */

/**
 * # 🏗 Compile Delegate Template
 *
 * Compiler for Algodex Template Language. Accepts a standard {@link Order}
 * and returns the template string with replaced values
 *
 * @param {Order} order The Order to Compile
 * @return {string}
 */
function compileDelegateTemplate(order) {
  // TODO: Validate the order
  const {
    min = 0,
    address: writerAddr,
    asset: {id: assetId},
    N,
    D,
    type,
    version = 3,
    appId: orderBookId,
  } = order;

  // TODO: Ensure we can know the side of the order, check with Alex
  const isASAEscrow = type === 'buy';

  if (isUndefined(min) || isNaN(min)) {
    throw new TypeError('Invalid minimum value!');
  }
  if (isUndefined(assetId) || isNaN(assetId)) {
    throw new TypeError('Invalid Asset Id');
  }
  if (isUndefined(N) || isNaN(N)) {
    throw new TypeError('Invalid Numerator');
  }
  if (isUndefined(D) || isNaN(D)) {
    throw new TypeError('Invalid Denominator');
  }
  if (isUndefined(orderBookId) || isNaN(orderBookId)) {
    throw new TypeError('Invalid Orderbook ID');
  }

  logger.debug('teal.template.compile', order);
  let delegateTemplate;
  if (!isASAEscrow) {
    if (version === 7) {
      logger.debug('not isASAEscrow, using version 7');
      delegateTemplate = algoDelegateTemplateV7;
    } else if (version === 6) {
      logger.debug('not isASAEscrow, using version 6');
      delegateTemplate = algoDelegateTemplateV6;
    } else if (version === 5) {
      logger.debug('not isASAEscrow, using version 5');
      delegateTemplate = algoDelegateTemplateV5;
    } else if (version === 4) {
      logger.debug('not isASAEscrow, using version 4');
      delegateTemplate = algoDelegateTemplateV4;
    } else {
      logger.debug('not isASAEscrow, using version 3');
      delegateTemplate = algoDelegateTemplate;
    }
  } else {
    if (version === 7) {
      // This should ideally use version 7 contracts, but due to a prior
      // software error, version 7 contracts were incorrectly using version 3.
      // We need to maintain that now for consistency between the client and
      // server node.js process.
      logger.debug('isASAEscrow, using version 7 (with v3 template)');
      delegateTemplate = asaDelegateTemplate;
    } else if (version === 6) {
      logger.debug('isASAEscrow, using version 6');
      delegateTemplate = asaDelegateTemplateV6;
    } else if (version === 5) {
      logger.debug('isASAEscrow, using version 5');
      delegateTemplate = asaDelegateTemplateV5;
    } else if (version === 4) {
      logger.debug('isASAEscrow, using version 4');
      delegateTemplate = asaDelegateTemplateV4;
    } else {
      logger.debug('isASAEscrow, using version 3');
      delegateTemplate = asaDelegateTemplate;
    }
  }
  logger.debug('min is: ' + min);
  /**
   * @typedef {Object} DelegateTemplateParams
   * @param {number} min Unused Parameter
   * @param {number} assetid Asset Index
   * @param {number} N Numerator
   * @param {number} D Denominator
   * @param {string} writerAddr Writer Address
   * @param {number} orderBookId Orderbook ID
   */
  let res = delegateTemplate.split('<min>').join(min);
  res = res.split('<assetid>').join(assetId);
  res = res.split('<N>').join(N);
  res = res.split('<D>').join(D);
  res = res.split('<contractWriterAddr>').join(writerAddr);
  res = res.split('<orderBookId>').join(orderBookId);

  return res;
}

/**
 * # 🏗 Compile Program
 *
 * helper function to compile program source
 *
 * @param {Algodv2} client Algorand SDK Client
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
 * @param {Algodv2} client Algorand SDK Client
 * @param {string} program The smart contract
 * @return {Promise<LogicSigAccount>}
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
  let compilation;
  if (hashedProgram in compilationResults) {
    compilationResult = compilationResults[hashedProgram];
    logger.debug('got compilation results from hash! ' + hashedProgram);
  } else {
    logger.debug('program not found in cache, fetching');
    compilation = await compileProgram(client, program);
    compilationResult = compilation.result;
    if (Object.keys(compilationResults).length > 200) {
      logger.debug('size is too large! resetting keys');
      compilationResults = {};
    }
    compilationResults[hashedProgram] = compilationResult;
  }

  const uintAr = Buffer.from(compilationResult, 'base64');
  const args = undefined;
  // TODO makeLogicSigAccount
  const lsig = algosdk.makeLogicSig(uintAr, args);
  logger.debug('lsig addr: ' + lsig.address());
  return lsig;
}

module.exports = {
  compileDelegateTemplate,
  compileProgram,
  compileLogicSig,
};
