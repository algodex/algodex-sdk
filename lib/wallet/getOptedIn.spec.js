/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const config = require('../teal/test/config');
const getOptedIn = require('./getOptedIn');
const AlgodexApi = require('../AlgodexApi');
const apiConfig = require('../../config.json');
describe.skip('getOptedIn', ()=>{
  beforeAll(async ()=>{
    if (!config.initalized) {
      await config.init(AlgodexApi, [apiConfig]);
      // config.setAssetIndex(21582668);
    }
  });
  it('should fetch optin status', async ()=>{
    const _optInTrue = await getOptedIn(config.api.algod, {address: config.openAccount.addr}, config.assetIndex);
    const _optInFalse = await getOptedIn(config.api.algod, {address: config.openAccount.addr}, 440307);

    expect(
        _optInTrue,
    ).toEqual(true);
    expect(
        _optInFalse,
    ).toEqual(false);
  });
});
