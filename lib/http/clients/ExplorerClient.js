/*
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/*
 * Explorer REST API Interface
 *
 * Includes useful responses from the publicly exposed routes
 *
 * @author Alexander Trefonas
 * @author Michael Feher
 * Algodex VASP (BVI) Corp.
 */

const HTTPClient = require('../HTTPClient');
const ALGO_PRICE_API = 'https://price.algoexplorerapi.io/price/algo-usd';

/**
 * Convert Explorer Asset to Algodex Asset
 *
 * Explorer returns a non-standard ASA format which must be mutated
 *
 * @see https://testnet.algoexplorerapi.io/v1/asset/408947/info
 * @param {Object} explorerIndexAsset The asset response
 * @return {object} Asset
 */

/**
 *
 * @see https://testnet.algoexplorerapi.io/v1/asset/408947/info
 * @param {ExplorerIndexAsset} data The asset response
 * @return {{circulating, total, deleted, decimals, name, verified, txid, fullName, id, url, timestamp, txns}}
 */
const toExplorerAsset = (data) => {
  const {
    index: id,
    'creation-txid': txid,
    'asset-tx-counter': txns,
    deleted,
    verification,
    params,
  } = data.asset;
  const {
    decimals,
    url,
    name: fullName,
    'unit-name': name,
    total,
    'circulating-supply': circulating,
  } = params;

  const res = {
    id,
    deleted,
    txid,
    decimals,
    name: name || fullName || null,
    txns,
    fullName,
    circulating,
    verified: typeof verification !== 'undefined',
    url: url || null,
    total,
  };

  if (typeof verification !== 'undefined') {
    console.log(verification);
    res.verified_info = verification;
  }
  return res;
};

/**
 * # 🕸 AlgoExplorer HTTP Client
 * @TODO: Generate from OAS/Swagger
 * @param {string} baseUrl Base URL to use for API requests
 * @extends HTTPClient
 * @ignore
 * @constructor
 */
function ExplorerClient(baseUrl) {
  // Apply client
  const client = new HTTPClient(baseUrl);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Statics
ExplorerClient.toExplorerAsset = toExplorerAsset;

// Extend from HTTPClient
ExplorerClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(ExplorerClient.prototype, {

  /**
   * ## [🔍 Search](#fetchExplorerSearch)
   *
   * ### ⚡ fetchExplorerSearch()
   *
   * @param {string | number} search Search Query
   * @return {Promise<*>}
   */
  async fetchExplorerSearch(search) {
    const {data} = await this.get(`${this.baseUrl}/rl/v1/search?keywords=${search}`);
    return data;
  },
  /**
   * Fetch Asset Info
   *
   * Uses Algodex Explorer V1 Asset Info API
   *
   * @param {string|number} id Asset ID
   * @return {Promise<{object}>}
   */
  async fetchExplorerAssetInfo(id) {
    if (typeof id === 'undefined') {
      throw new TypeError('Must have ID');
    }
    const {data} = await this.get(`${this.baseUrl}/v2/assets/${id}`);
    return ExplorerClient.toExplorerAsset(data);
  },
  /**
   * Get Algorand price
   *
   * Retrieve price of Algorand from the Algorand Indexer
   *
   * @see https://price.algoexplorerapi.io/price/algo-usd
   */
  async fetchAlgorandPrice() {
    const {data} = await this.get(`${ALGO_PRICE_API}`);
    return {algoPrice: data.price};
  },
});

module.exports = ExplorerClient;
