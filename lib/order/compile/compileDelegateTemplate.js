/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
 * @param {number} min
 * @param {number} assetid
 * @param {number} N
 * @param {number} D
 * @param {number} orderBookId
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
    version = 6,
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
function compileDelegateTemplate(order = {}) {
  const _args = _mapOrderToTemplateArgs(order);

  // Check properties
  const err = _getTemplateErrors(_args);
  if (err.length > 0) throw err[0];

  return compileTemplate(
      _args,
      _mapOrderToTemplate(order),
  );
}

module.exports = compileDelegateTemplate;

if (process.env.NODE_ENV === 'test') {
  compileDelegateTemplate._mapOrderToTemplate = _mapOrderToTemplate;
  compileDelegateTemplate._getTemplateErrors = _getTemplateErrors;
  compileDelegateTemplate._mapOrderToTemplateArgs = _mapOrderToTemplateArgs;
}
