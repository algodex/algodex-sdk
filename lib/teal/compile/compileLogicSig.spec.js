/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const compileLogicSig = require('./compileLogicSig');
const teal = require('../ClearProgram.teal');
it('should compile a LogicSigAccount', async ()=>{
  const client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http:/ec2-3-18-80-65.us-east-2.compute.amazonaws.com', 8080 );

  try {
    await compileLogicSig();
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }
  try {
    await compileLogicSig(client);
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }

  const lsig = await compileLogicSig(client, teal);
  expect(lsig).toBeInstanceOf(algosdk.LogicSigAccount);
});
