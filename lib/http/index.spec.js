/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

const http = require('./index');

it('should export the http module', ()=>{
  expect(http.ExplorerClient).toBeInstanceOf(Function);
  expect(http.IndexerClient).toBeInstanceOf(Function);
  expect(http.HTTPClient).toBeInstanceOf(Function);
});
