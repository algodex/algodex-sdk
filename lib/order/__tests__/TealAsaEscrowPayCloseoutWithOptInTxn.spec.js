/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const accountSetup = require('./accountSetup.js');
const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
const {timeout} = require('../../teal/utils');
const executeASAEscrowOrderTest = require('./teal_tests/executeASAEscrowOrder');
const JEST_MINUTE_TIMEOUT = 60 * 10000;
const config = require('./TealConfig');
const takerAccountCleanup = require('./takerAccountCleanup');
const generateAsset = require('./GenerateAsset');
const destroyAsset = require('./DestroyAsset');

//
describe('ASA ESCROW PAY CLOSEOUT WITH OPT IN TXN', () => {
  const asaAmount = 0.4;
  const price = 1.25;
  const executorAmount = 0.41;


  beforeAll(async () => {
    const assetId = await generateAsset(config.openAccount);
    console.log(assetId);


    const note = `
    Testing: TealAsaEscrowPayCloseoutWithOptInTxn
    assetId: ${assetId}
    Open Account: ${config.openAccount.addr}
    Creator Account: ${config.creatorAccount.addr}
    Executor Account: ${config.executorAccount.addr}

    Creator Account is selling ${asaAmount} LAMPC at price: ${price} Algo
    Executor Account is buying ${executorAmount} LAMPC (rounding issue normally will be ${asaAmount})
  `;
    config.assetId = assetId;

    await accountSetup(config, 'sell', false, true, note);// Since we're testing withOptIn on the executor account we pass false for optIn in account setup
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);
    await takerAccountCleanup(config, 'sell', executorAmount, true);
    await destroyAsset(config.openAccount, config.assetId);
  }, JEST_MINUTE_TIMEOUT);

  test(
      'Place asa escrow order',
      async () => {
        const result = await placeASAOrderTest.runTest(config, asaAmount, price);
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT,
  );

  test(
      'Closeout execute asa escrow order with Optin',
      async () => {
        const result = await executeASAEscrowOrderTest.runTest(
            config,
            executorAmount,
            price,
        );
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT,
  );
});
