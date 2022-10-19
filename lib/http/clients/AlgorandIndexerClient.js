/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/*
 * Algorand Indexer REST API Interface
 *
 * Algodex VASP (BVI) Corp.
 */
const HTTPClient = require('../HTTPClient');

/**
 * Algorand Indexer HTTP Client
 *
 * @TODO: Remove this in favor of algosdk.Indexer()
 * @param {string} baseUrl Base URL to use for API requests
 * @extends HTTPClient
 * @memberOf module:http
 */
function AlgorandIndexerClient(baseUrl) {
  // Apply client
  const client = new HTTPClient(baseUrl);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Extend from HTTPClient
AlgorandIndexerClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(AlgorandIndexerClient.prototype, {
  /**
   * Search Explorer Assets
   *
   * @param {string | number} search Search Query
   * @return {Promise<*>}
   * @memberOf module:http.AlgodexIndexerClient.prototype
   */
  async fetchTransactionParams() {
    const {data} = await this.get(`${this.baseUrl}/v2/transactions/params`);
    return data;
  },
});

module.exports = AlgorandIndexerClient;
