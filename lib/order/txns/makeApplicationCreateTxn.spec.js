/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const AlgodexApi = require('../../AlgodexApi');
const apiConfig = require('../../../config.json');
const config = require('../../teal/test/config');
const makeApplicationCreateTxn = require('./makeApplicationCreateTxn');
const initAccounts = require('../../teal/test/initAccounts');
let txn;

const isIntegration = process.env.TEST_ENV === 'integration';
jest.setTimeout(isIntegration ? 60 * 1000 : 5000);

describe('makeApplicatoinCreateTxn', ()=>{
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
      if (isIntegration) {
        await initAccounts(config);
      }
    }
  });
  it('should create an buy orderbook', async ()=>{
    txn = await makeApplicationCreateTxn(config.client, 'buy', config.creatorAccount);
    expect(txn).toBeInstanceOf(algosdk.Transaction);
    expect(txn.type).toEqual('appl');
    expect(txn.appArgs.length).toEqual(0);
  });

  if (isIntegration) {
    it('should sign and propagate transactions', async ()=>{
      // Sign the transaction
      const signedTxn = txn.signTxn(config.creatorAccount.sk);
      // Submit the transaction
      await config.client.sendRawTransaction(signedTxn).do();

      // Wait for confirmation
      const res = await algosdk.waitForConfirmation(config.client, txn.txID().toString(), 10);
      console.log('✅ Application Deployment: ', res['application-index']);
    });
  }
});
