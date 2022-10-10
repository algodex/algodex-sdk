/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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
