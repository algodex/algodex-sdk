/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const AlgodError = require('../../../error/AlgodError');
const AlgodexApi = require('../../../AlgodexApi');
const apiConfig = require('../../../../config.json');
const config = require('../../../teal/test/config');
const withLogicSigAccount = require('../../compile/withLogicSigAccount');
const makeCloseAlgoTxns = require('./makeCloseAlgoTxns');
const withCloseAlgoTxns = require('./withCloseAlgoTxns');
const sdkSigner = require('../../../wallet/signers/AlgoSDK');
let orderbook;
/**
 * Close Algo Order Tests
 */
describe('makeCloseAlgo', ()=>{
  // TODO configure test accounts with beforeAll when TEST_ENV==='integration'
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
    }
  });
  // TODO configure test accounts with afterAll when TEST_ENV==='integration'
  // afterAll()

  it('should have a valid client', async ()=>{
    await expect(makeCloseAlgoTxns({})).rejects.toBeInstanceOf(AlgodError);
  });

  it('should have a valid application index', async ()=>{
    await expect(makeCloseAlgoTxns({client: config.client, appId: ()=>{}})).rejects.toBeInstanceOf(TypeError);
  });

  it(`should create CloseAlgoTxns`, async ()=>{
    // Fetch orders
    if (typeof orderbook === 'undefined') {
      const res = await config.api.http.dexd.fetchOrders('wallet', config.openAccount.addr);
      // TODO add clean api endpoint
      orderbook = res.filter((o)=>o.type === 'buy')
          .map(async (o)=> {
            return await sdkSigner([await withCloseAlgoTxns(await withLogicSigAccount({
              ...o,
              client: config.client,
              address: config.openAccount.addr,
            }))], config.openAccount.sk);
          });
    }
    orderbook = await Promise.all(orderbook);
  }, 50000);

  if (process.env.TEST_ENV === 'integration') {
    it('should send transactions', async ()=>{
      // TODO: Ensure valid testbed
      await Promise.all(orderbook.map(async (o)=>{
        await o;
        await config.client.sendRawTransaction(o[0].map((txn)=>txn.blob)).do();
      }));
    });
  }
  // });
});
