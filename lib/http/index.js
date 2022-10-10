/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/**
 * # HTTP Namespace for all axios calls
 *
 * @example
 * import http from '@algodex/algodex-sdk/lib/http'
 * const dexClient = new http.AlgodexClient('https://testnet.algodex.com/algodex-backend')
 * let asset = await dexClient.fetchAsset({id: 123456})
 *
 * @namespace http
 */
module.exports = {
  ExplorerClient: require('./clients/ExplorerClient'),
  IndexerClient: require('./clients/IndexerClient'),
  HTTPClient: require('./HTTPClient'),
};


