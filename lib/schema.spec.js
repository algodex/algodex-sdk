/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const ajv = require('./schema');
const algosdk = require('algosdk');
const client = new algosdk.Algodv2('', 'https://node.algoexplorerapi.io', '');
it('should instanceof check', ()=>{
  expect(ajv.validate({instanceof: 'Ajv'}, ajv)).toEqual(true);
  expect(ajv.validate({instanceof: 'Algodv2'}, client)).toEqual(true);
});
