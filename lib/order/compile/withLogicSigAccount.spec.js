/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const algosdk = require('algosdk');
const withLogicSigAccount = require('./withLogicSigAccount');
const withUnits = require('./withUnits');
const {LogicSigAccount} = require('algosdk');
const order = require('../../__tests__/Orders.json')[0];
it('should compile lsig', async ()=>{
  try {
    await withLogicSigAccount(order);
  } catch (e) {
    expect(e).toBeInstanceOf(TypeError);
  }

  order.client = new algosdk.Algodv2(
      '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'http:/ec2-3-18-80-65.us-east-2.compute.amazonaws.com', 8080 );

  const res = await withLogicSigAccount(withUnits(order));

  expect(res.contract.lsig).toBeInstanceOf(LogicSigAccount);
});
