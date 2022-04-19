const algosdk = require('algosdk');
const compileLogicSig = require('../../teal/compile/compileLogicSig.js');
const compileTemplate = require('../../teal/compile/compileTemplate.js');

const templates = {
  algo: {
    v7: require('../teal/templates/ALGO_Delegate_v7.template.teal'),
    v6: require('../teal/templates/ALGO_Delegate_v6.template.teal'),
    v5: require('../teal/templates/ALGO_Delegate_v5.template.teal'),
    v4: require('../teal/templates/ALGO_Delegate_v4.template.teal'),
    v3: require('../teal/templates/ALGO_Delegate.template.teal'),
  },
  asa: {
    // This should ideally use version 7 contracts, but due to a prior
    // software error, version 7 contracts were incorrectly using version 3.
    // We need to maintain that now for consistency between the client and
    // server node.js process.
    v7: require('../teal/templates/ASA_Delegate.template.teal'),
    v6: require('../teal/templates/ASA_Delegate_v6.template.teal'),
    v5: require('../teal/templates/ASA_Delegate_v5.template.teal'),
    v4: require('../teal/templates/ASA_Delegate_v4.template.teal'),
    v3: require('../teal/templates/ASA_Delegate.template.teal'),
  },
};

/**
 *
 * @param {Order} order The Order
 * @return {*}
 * @private
 */
function _mapOrderToTemplate(order = {}) {
  const {type, version} = order;
  return templates[
    type === 'sell' ? 'asa' : 'algo'
  ][`v${version}`];
}

/**
 * Validate the template arguments and returns an error
 *
 * @param min
 * @param assetid
 * @param N
 * @param D
 * @param orderBookId
 * @return {Array<TypeError>}
 * @private
 */
function _getTemplateErrors({min, assetid, N, D, orderBookId}={}) {
  const errs = [];
  if (typeof min !== 'number') {
    errs.push(new TypeError('Invalid minimum value!'));
  }
  if (typeof assetid !== 'number') {
    errs.push(new TypeError('Invalid Asset Id'));
  }
  if (typeof N !== 'number') {
    errs.push(new TypeError('Invalid Numerator'));
  }
  if (typeof D !== 'number') {
    errs.push(new TypeError('Invalid Denominator'));
  }
  if (typeof orderBookId !== 'number') {
    errs.push(new TypeError('Invalid Orderbook ID'));
  }
  return errs;
}

/**
 * Map Order to Template Args
 * @param {Order} order
 * @return {{contractWriterAddr, min: number, D, orderBookId, assetid, type, version: number, N}}
 * @private
 */
function _mapOrderToTemplateArgs(order ) {
  if (typeof order === 'undefined') throw new TypeError('Must have a order!');
  if (typeof order.contract === 'undefined') throw new TypeError('Must have a contract state!');
  const {
    min = 0,
    address: contractWriterAddr,
    asset: {id: assetid},
    contract: {N, D},
    type,
    version = 3,
    appId: orderBookId,
  } = order;

  return {
    min,
    contractWriterAddr,
    assetid,
    N, D,
    type,
    version,
    orderBookId,
  };
}
/**
 * ## 🏗 Compile Delegate Template
 *
 * Compiler for Algodex Template Language. Accepts a standard {@link Order}
 * and returns the template string with replaced values
 *
 * @param {Order} order The Order to Compile
 * @return {string}
 * @private
 */
function _compileDelegateTemplate(order = {}) {
  const _args = _mapOrderToTemplateArgs(order);

  // Check properties
  const err = _getTemplateErrors(_args);
  if (err.length > 0) throw err[0];

  return compileTemplate(
      _args,
      _mapOrderToTemplate(order),
  );
}

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
async function   withLogicSigAccount(o) {
  if (!(o?.client instanceof algosdk.Algodv2)) {
    throw new TypeError('Invalid Algod Client!');
  }

  const lsig = await compileLogicSig(
      o.client,
      _compileDelegateTemplate(o),
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

if (process.env.NODE_ENV === 'test') {
  withLogicSigAccount._compileDelegateTemplate = _compileDelegateTemplate;
  withLogicSigAccount._mapOrderToTemplate = _mapOrderToTemplate;
  withLogicSigAccount._getTemplateErrors = _getTemplateErrors;
  withLogicSigAccount._mapOrderToTemplateArgs = _mapOrderToTemplateArgs;
}
