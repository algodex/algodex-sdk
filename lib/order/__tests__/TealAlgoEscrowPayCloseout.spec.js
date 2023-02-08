/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const accountSetup = require('./accountSetup.js');
const placeAlgoOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
const {timeout} = require('../../teal/utils');
const closeAlgoOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
const executeAlgoEscrowOrderTest = require('./teal_tests/executeAlgoEscrowOrder');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const config = require('./TealConfig');
const takerAccountCleanup = require('./takerAccountCleanup');
const generateAsset = require('./GenerateAsset');
const destroyAsset = require('./DestroyAsset');

//
describe('Algo ESCROW PAY CLOSEOUT', () => {
  const asaAmount = 0.4;
  const price = 1.25;
  const executorAmount = 0.4;


  beforeAll(async () => {
    const assetId = await generateAsset(config.openAccount);
    console.log(assetId);

    const note = `
    Testing: TealAlgoEscrowPayCloseout
    assetId: ${assetId}
    Open Account: ${config.openAccount.addr}
    Creator Account: ${config.creatorAccount.addr}
    
    Creator Account is buying ${asaAmount} LAMPC at price: ${price} Algo
    Executor Account is selling ${executorAmount} LAMPC 
  `;
    config.assetId = assetId;
    await accountSetup(config, 'buy', true, true, note);
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT*3);

  afterAll(async () => {
    await timeout(4000);
    await takerAccountCleanup(config, 'buy', executorAmount, true);
    await destroyAsset(config.openAccount, config.assetId);
  }, JEST_MINUTE_TIMEOUT);

  test(
      'Place Algo escrow order',
      async () => {
      // set up the Algo Escrow to be executed
        const result = await placeAlgoOrderTest.runTest(config, asaAmount, price);
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT,
  );

  test(
      'Closeout algo escrow order (no opt-in txn)',
      async () => {
        const result = await executeAlgoEscrowOrderTest.runTest(
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
      'Close algo escrow order',
      async () => {
        const result = await closeAlgoOrderTest.runTest(
            config,
            price,
            asaAmount - executorAmount,
        );
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT,
  );
});
