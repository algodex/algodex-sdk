const algosdk = require('algosdk');
const logger = require('pino')();
const {compileLogicSig, compileTemplate} = require('../../teal');
const {isUndefined} = require('lodash/lang');

const algoV7 = require('../teal/templates/ALGO_Delegate_v7.template.teal');
const algoV6 = require('../teal/templates/ALGO_Delegate_v6.template.teal');
const algoV5 = require('../teal/templates/ALGO_Delegate_v5.template.teal');
const algoV4 = require('../teal/templates/ALGO_Delegate_v4.template.teal');
const algoV3 = require('../teal/templates/ALGO_Delegate.template.teal');
const asaV3 = require('../teal/templates/ASA_Delegate.template.teal');
const asaV6 = require('../teal/templates/ASA_Delegate_v6.template.teal');
const asaV5 = require('../teal/templates/ASA_Delegate_v5.template.teal');
const asaV4 = require('../teal/templates/ASA_Delegate_v4.template.teal');

/**
 * # 🏗 Compile Delegate Template
 *
 * Compiler for Algodex Template Language. Accepts a standard {@link Order}
 * and returns the template string with replaced values
 *
 * @param {Order} data The Order to Compile
 * @return {string}
 */
function compileDelegateTemplate(data) {
  // TODO: Accept path and data to be more generic
  const {
    min = 0,
    address: writerAddr,
    asset: {id: assetId},
    contract: {N, D},
    type,
    version = 3,
    appId: orderBookId,
  } = data;

  // TODO: Ensure we can know the side of the order, check with Alex
  const isASAEscrow = type === 'sell';

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

  logger.debug('teal.template.compile', data);
  let delegateTemplate;
  if (!isASAEscrow) {
    if (version === 7) {
      logger.debug('not isASAEscrow, using version 7');
      delegateTemplate = algoV7;
    } else if (version === 6) {
      logger.debug('not isASAEscrow, using version 6');
      delegateTemplate = algoV6;
    } else if (version === 5) {
      logger.debug('not isASAEscrow, using version 5');
      delegateTemplate = algoV5;
    } else if (version === 4) {
      logger.debug('not isASAEscrow, using version 4');
      delegateTemplate = algoV4;
    } else {
      logger.debug('not isASAEscrow, using version 3');
      delegateTemplate = algoV3;
    }
  } else {
    if (version === 7) {
      // This should ideally use version 7 contracts, but due to a prior
      // software error, version 7 contracts were incorrectly using version 3.
      // We need to maintain that now for consistency between the client and
      // server node.js process.
      logger.debug('isASAEscrow, using version 7 (with v3 template)');
      delegateTemplate = asaV3;
    } else if (version === 6) {
      logger.debug('isASAEscrow, using version 6');
      delegateTemplate = asaV6;
    } else if (version === 5) {
      logger.debug('isASAEscrow, using version 5');
      delegateTemplate = asaV5;
    } else if (version === 4) {
      logger.debug('isASAEscrow, using version 4');
      delegateTemplate = asaV4;
    } else {
      logger.debug('isASAEscrow, using version 3');
      delegateTemplate = asaV3;
    }
  }
  logger.debug('min is: ' + min);

  return compileTemplate({
    min,
    assetid: assetId,
    N,
    D,
    contractWriterAddr: writerAddr,
    orderBookId,
  }, delegateTemplate);
}

/**
 *
 * @param {Order} o Algodex Order
 * @return {Promise.<Order>}
 * @memberOf module:order/compile
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
