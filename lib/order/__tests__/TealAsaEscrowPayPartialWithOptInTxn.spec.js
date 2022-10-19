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
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const executeASAEscrowOrderTest = require('./teal_tests/executeASAEscrowOrder');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const config = require('./TealConfig');
const takerAccountCleanup = require('./takerAccountCleanup');
const generateAsset = require('./GenerateAsset');
const destroyAsset = require('./DestroyAsset');

describe('ASA ESCROW PAY PARTIAL WITH OPT IN TXN', () => {
  const asaAmount = 0.4;
  const price = 1.20;
  const executorAmount = 0.2;


  beforeAll(async () => {
    const assetId = await generateAsset(config.openAccount);
    console.log(assetId);


    const note = `
    Testing: TealAsaEscrowPayPartialWithOptInTxn
    assetId: ${assetId}
    Open Account: ${config.openAccount.addr}
    Creator Account: ${config.creatorAccount.addr}
    Executor Account: ${config.executorAccount.addr}

    Creator Account is selling ${asaAmount} LAMPC at price: ${price} Algo
    Executor Account is buying ${executorAmount} LAMPC 
  `;
    config.assetId = assetId;
    await accountSetup(config, 'sell', false, true, note);// Since we're testing withOptIn on the executor account we pass false for optIn in account setup
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);
    await takerAccountCleanup(config, 'sell', executorAmount);
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
      'Partially execute asa escrow order with Optin',
      async () => {
        const result = await executeASAEscrowOrderTest.runTest(
            config,
            executorAmount,
            price,
        );
        expect(result).toBeTruthy();
        await timeout(4000);
      },
      JEST_MINUTE_TIMEOUT,
  );

  test(
      'Close asa escrow order',
      async () => {
        const result = await closeASAOrderTest.runTest(
            config,
            price,
            asaAmount - executorAmount,
        );
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT,
  );
});
