/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../test/config');
const {blankProgramSource} = require('../test/utils');
const makeApplicationCreateTxn = require('./makeApplicationCreateTxn');

describe('teal.txns.makeApplicationCreateTxn()', ()=>{
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
    }
  });

  it('should have a valid client', async ()=>{
    await expect(makeApplicationCreateTxn(
        undefined,
    )).rejects.toBeInstanceOf(AlgodError);
  });

  it('should have a creator account', async ()=>{
    await expect(makeApplicationCreateTxn(
        config.client,
        {addr: 1234}),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it('should have a program source', async ()=>{
    await expect(makeApplicationCreateTxn(
        config.client,
        config.creatorAccount,
        undefined,
        undefined,
        12345,
    )).rejects.toBeInstanceOf(TypeError);
  });

  it('should have a local and global state restriction', async ()=>{
    await expect(makeApplicationCreateTxn(
        config.client,
        config.creatorAccount,
        undefined,
        undefined,
        blankProgramSource,
        undefined,
        undefined,
        1,
        1,
        1,
    )).rejects.toBeInstanceOf(TypeError);
  });

  it('should create an application transaction from a string', async ()=>{
    const txn = await makeApplicationCreateTxn(
        config.client,
        algosdk.generateAccount(),
        undefined,
        undefined,
        blankProgramSource,
        undefined,
        2,
        1,
        0,
        1,
    );
    expect(txn).toBeInstanceOf(algosdk.Transaction);
    expect(txn.type).toEqual('appl');
    expect(txn.appArgs.length).toEqual(0);
  });
});
