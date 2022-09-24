/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const {isString} = require('lodash/lang');

/**
 * ## 🏗 [Compile Program](#compileProgram)
 *
 * helper function to compile program source
 *
 * @param {algosdk.Algodv2} client Algorand SDK Client
 * @param {string} program Program source
 * @return {Promise<Uint8Array>}
 * @memberOf module:teal/compile
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

module.exports = compileProgram;
