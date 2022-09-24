/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const compileProgram = require('./compileProgram');
const teal = require('../ClearProgram.teal');
it('should compile a program', async ()=>{
  const client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http:/ec2-3-18-80-65.us-east-2.compute.amazonaws.com', 8080 );

  try {
    await compileProgram();
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }
  try {
    await compileProgram(client);
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }

  const program = await compileProgram(client, teal);
  expect(program).toBeInstanceOf(Uint8Array);
});
