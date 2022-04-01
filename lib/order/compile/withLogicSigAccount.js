const algosdk = require('algosdk');
const logger = require('pino')();
const compileLogicSig = require('../../teal/compile/compileLogicSig.js');
const compileTemplate = require('../../teal/compile/compileTemplate.js');

const {isUndefined} = require('lodash/lang');

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
 * @param type
 * @param version
 * @return {*}
 * @private
 */
function _mapOrderToTemplate({type, version}) {
  return templates[
    type === 'sell' ? 'asa' : 'algo'
  ][`v${version}`];
}
/**
 * ## 🏗 Compile Delegate Template
 *
 * Compiler for Algodex Template Language. Accepts a standard {@link Order}
 * and returns the template string with replaced values
 *
 * @param {Order} data The Order to Compile
 * @return {string}
 * @private
 */
function _compileDelegateTemplate({
  min = 0,
  address: contractWriterAddr,
  asset: {id: assetid},
  contract: {N, D},
  type,
  version = 3,
  appId: orderBookId,
} = {}) {
  if (typeof min !== 'number') {
    throw new TypeError('Invalid minimum value!');
  }
  if (typeof assetid !== 'number') {
    throw new TypeError('Invalid Asset Id');
  }
  if (typeof N !== 'number') {
    throw new TypeError('Invalid Numerator');
  }
  if (typeof D !== 'number') {
    throw new TypeError('Invalid Denominator');
  }
  if (typeof orderBookId !== 'number') {
    throw new TypeError('Invalid Orderbook ID');
  }

  return compileTemplate(
      {
        min,
        assetid,
        N,
        D,
        contractWriterAddr,
        orderBookId,
      },
      _mapOrderToTemplate({type, version}),
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
async function withLogicSigAccount(o) {
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
}
