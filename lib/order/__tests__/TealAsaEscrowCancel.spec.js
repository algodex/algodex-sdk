/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const config = require('./TealConfig');
const {timeout} = require('../../../lib/teal/utils');
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
const accountSetup = require('./accountSetup.js');
const accountCleanup = require('./accountCleanup');
const generateAsset = require('./GenerateAsset');
const destroyAsset = require('./DestroyAsset');


describe('ASA ESCROW CANCEL', () => {
  const price = 1.2;
  const amount = 0.8;


  // Create App
  beforeAll(async () => {
    const assetId = await generateAsset(config.openAccount);
    console.log(assetId);

    const note = `
    Testing: TealAsaEscrowCancel
    assetId: ${assetId}

    Open Account: ${config.openAccount.addr}
    Creator Account: ${config.creatorAccount.addr}
    
    Creator Account is buying ${amount} LAMPC at price: ${price} Algo
  `;
    config.assetId = assetId;

    await accountSetup(config, 'sell', true, true, note);
    await timeout(7000);
  }, JEST_MINUTE_TIMEOUT * 10);

  afterAll(async () => {
    await timeout(4000);
    await accountCleanup(config, 'sell', true);
    await destroyAsset(config.openAccount, config.assetId);
  }, JEST_MINUTE_TIMEOUT);

  test(
      'Place asa escrow order',
      async () => {
        const result = await placeASAOrderTest.runTest(config, amount, price);
        expect(result).toBeTruthy();
        await timeout(4000);
      },
      JEST_MINUTE_TIMEOUT,
  );

  test(
      'Close asa escrow order',
      async () => {
        const result = await closeASAOrderTest.runTest(config, price, amount);
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT * 2,
  );
});
