/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const defaultClearProgramSource = require('../../teal/ClearProgram.teal');
const {compileProgram} = require('../compile');

const getTransactionParams = require('../getTransactionParams');

/**
 * # 🏗 Application Create Transaction
 *
 * @param {algosdk.Algodv2} client - Algorand SDK client
 * @param {algosdk.Account | string} from - address of sender
 * @param {algosdk.SuggestedParams} [suggestedParams] - a dict holding common-to-all-txns
 * @param {algosdk.OnApplicationComplete} [onComplete] - what application should do once the
 *     program is done being run
 * @param {string} approvalProgramSource - approval program source
 * @param {string} [clearProgramSource] - clear program source
 * @param {number} numLocalInts - restricts number of ints in per-user local state
 * @param {number} numLocalByteSlices - restricts number of byte slices in per-user local state
 * @param {number} numGlobalInts - restricts number of ints in global state
 * @param {number} numGlobalBytesSlice - restricts number of byte slices in global state
 * @return {Promise<Transaction>}
 * @memberOf module:teal/txns
 */
async function makeApplicationCreateTxn(
    client,
    from,
    suggestedParams,
    onComplete,
    approvalProgramSource,
    clearProgramSource,
    numLocalInts,
    numLocalByteSlices,
    numGlobalInts,
    numGlobalBytesSlice,
) {
  if (!(client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Must have valid Algod client!');
  }
  /**
   * From Account
   * @type {string}
   * @private
   */
  const _from = typeof from?.addr === 'undefined' && typeof from === 'string' ?
      from :
      from.addr;

  if (typeof _from !== 'string') {
    throw new TypeError('Accounts must be valid!');
  }

  if (typeof approvalProgramSource !== 'string' ) {
    throw new TypeError('Approval Program Source must be a string!');
  }

  if (
    typeof numLocalInts !== 'number' ||
    typeof numLocalByteSlices !== 'number' ||
    typeof numGlobalInts !== 'number' ||
    typeof numGlobalBytesSlice !== 'number'
  ) {
    throw new TypeError('Invalid contract state storage!');
  }

  /**
   * On Complete
   * @type {algosdk.OnApplicationComplete|algosdk.OnApplicationComplete.NoOpOC}
   * @private
   */
  const _onComplete = typeof onComplete !== 'undefined' ?
    onComplete :
    algosdk.OnApplicationComplete.NoOpOC;

  /**
   * Suggested Params
   * @type {algosdk.SuggestedParams}
   * @private
   */
  const _suggestedParams = await getTransactionParams(
      client,
      suggestedParams,
      true,
  );

  /**
   * Clear Program Source
   * @type {string}
   * @private
   */
  const _clearProgramSource = typeof clearProgramSource === 'undefined' ?
    defaultClearProgramSource :
    clearProgramSource;

  /**
   * Approval Program
   * @type {Uint8Array}
   * @private
   */
  const _approvalProgram = await compileProgram(client, approvalProgramSource);
  /**
   * Clear Program
   * @type {Uint8Array}
   * @private
   */
  const _clearProgram = await compileProgram(client, _clearProgramSource);


  return algosdk.makeApplicationCreateTxn(
      _from,
      _suggestedParams,
      _onComplete,
      _approvalProgram,
      _clearProgram,
      numLocalInts,
      numLocalByteSlices,
      numGlobalInts,
      numGlobalBytesSlice,
  );
}

module.exports = makeApplicationCreateTxn;
