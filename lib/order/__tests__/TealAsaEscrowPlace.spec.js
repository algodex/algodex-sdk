/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/* eslint-disable */


const placeASAOrderTest = require('./teal_tests/placeASAEscrowOrder.js');
const constants = require('./constants.js');
const accountSetup = require('./accountSetup.js');
const accountCleanup = require('./accountCleanup.js');
const JEST_MINUTE_TIMEOUT = 60 * 1000;
const closeASAOrderTest = require('./teal_tests/closeASAEscrowOrder.js');
const generateAsset = require('./GenerateAsset');
const destroyAsset = require('./DestroyAsset')

const config = require('./TealConfig.js');

console.log(
    'DEBUG_SMART_CONTRACT_SOURCE is: ' + constants.DEBUG_SMART_CONTRACT_SOURCE,
);

/* eslint-disable valid-jsdoc */
describe('ASA ESCROW PLACE', () => {
  function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  const asaAmount = 0.4;
  const price = 1.25;


  beforeAll(async () => {
    const assetId = await generateAsset(config.openAccount);
    console.log(assetId);

    const note = `
    Testing: TealAsaEscrowPlace
    assetId: ${assetId}
    Open Account: ${config.openAccount.addr}
    Creator Account: ${config.creatorAccount.addr}
    Creator Account is selling ${asaAmount} LAMPC at price: ${price} Algo
  `;
    config.assetId = assetId

    await accountSetup(config, 'sell', true, false, note);
    await timeout(7000); // Eliminates race condition where future indexer calls occur before setUp step fully propogates but after it succeeds
  }, JEST_MINUTE_TIMEOUT);

  afterAll(async () => {
    await timeout(4000);
    await accountCleanup(config, 'sell', true);
    await destroyAsset(config.openAccount, config.assetId);

  }, JEST_MINUTE_TIMEOUT);


  test(
      'Place asa escrow order',
      async () => {

        const result = await placeASAOrderTest.runTest(config, asaAmount, price);
        expect(result).toBeTruthy();
        await timeout(4000);
      },
      JEST_MINUTE_TIMEOUT,
  );

  test(
      'Close asa escrow order',
      async () => {
      // const price = 1.25;
        const result = await closeASAOrderTest.runTest(config, price, asaAmount);
        expect(result).toBeTruthy();
      },
      JEST_MINUTE_TIMEOUT,
  );
});
//
