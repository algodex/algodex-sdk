/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
const config = require('./TealConfig');
const {timeout} = require('../../../lib/teal/utils');
const placeAlgoOrderTest = require('./teal_tests/placeAlgoEscrowOrder.js');
const closeAlgoOrderTest = require('./teal_tests/closeAlgoEscrowOrder.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const accountSetup = require('./accountSetup.js');
const accountCleanup = require('./accountCleanup');
const generateAsset = require('./GenerateAsset');
const destroyAsset = require('./DestroyAsset');


describe(`ALGO ESCROW CANCEL`, () => {
  const price = 1.2;
  const amount = 0.8;

  beforeAll(async () => {
    const assetId = await generateAsset(config.openAccount);
    console.log(assetId);

    const note = `
    Testing: TealAlgoEscrowCancel
    assetId: ${assetId}
    Open Account: ${config.openAccount.addr}
    Creator Account: ${config.creatorAccount.addr}
    
    Creator Account is buying ${amount} LAMPC at price: ${price} Algo
  `;
    config.assetId = assetId;

    await accountSetup(config, 'buy', true, false, note);
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);
    await accountCleanup(config, 'buy', true);
    await destroyAsset(config.openAccount, config.assetId);
  }, JEST_MINUTE_TIMEOUT);


  test(
      'Place Algo Escrow Order',
      async () => {
        const result = await placeAlgoOrderTest.runTest(config, amount, price);
        expect(result).toBeTruthy();

        await timeout(7000);
      },
      JEST_MINUTE_TIMEOUT * 10,
  );

  test(
      'Close Algo escrow order',
      async () => {
        const result = await closeAlgoOrderTest.runTest(config, price, amount);
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT * 2,
  );
});
