/*
 * Explorer REST API Interface
 *
 * Includes useful responses from the publicly exposed routes
 *
 * @author Alexander Trefonas
 * @author Michael Feher
 * @copyright Algonaut Inc
 */

const HTTPClient = require('../HTTPClient');

/**
 * Account info from Algorand Indexer
 * @param {Wallet} wallet
 * @return {Object}
 * @private
 */
const _getEmptyAccountInfo = (wallet) => {
  return {
    'amount': 0,
    'amount-without-pending-rewards': 0,
    'apps-local-state': [],
    'apps-total-schema': {'num-byte-slice': 0, 'num-uint': 0},
    'assets': [],
    'created-apps': [],
    'created-assets': [],
    'pending-rewards': 0,
    'reward-base': 0,
    'rewards': 0,
    'round': -1,
    'status': 'Offline',
    ...wallet,
  };
};

/**
 * # 🕸 Indexer HTTP Client
 * @TODO: Generate from OAS/Swagger
 * @TODO: hoist etags to top level config
 * @param {string} baseUrl Base URL to use for API requests
 * @param {boolean} [etags] Optional etags to cache
 * @param {Config} config Requited configuration for indexer. Must support token
 * @extends HTTPClient
 * @ignore
 * @constructor
 */
function IndexerClient(baseUrl, etags, config) {
  // Apply client
  const client = new HTTPClient(baseUrl, etags, config);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Extend from HTTPClient
IndexerClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(IndexerClient.prototype, {
  /**
   * Fetch Account Info
   * @param {Wallet} wallet
   * @return {Promise<Wallet>}
   */
  async fetchAccountInfo(wallet) {
    if (typeof wallet === 'undefined' || typeof wallet.address === 'undefined') {
      throw new TypeError('Must have a valid wallet!');
    }
    const {token, port} = this.config.indexer;
    const portPath = typeof port === 'undefined' ? '' : `:${port}`;
    const urlPath = this.baseUrl + portPath + '/v2/accounts/' + wallet.address;

    const response = await this.get(
        urlPath, {headers:
          {
            'X-Indexer-API-Token': token,
            'x-api-key': token,
          },
        },
    );
    if (response.data && response.data.account) {
      return response.data.account;
    }
  },
  /**
   * Fetch Accounts
   * @param {Array<Wallet>} addresses
   * @return {Promise<Object>}
   */
  async fetchAccounts(addresses) {
    if (!Array.isArray(addresses)) {
      throw new TypeError('Addresses must be an Array!');
    }
    if (addresses.length === 0) {
      return {};
    }

    return await Promise.all(addresses.map(async (wallet) => {
      try {
        const accountInfo = await this.fetchAccountInfo(wallet);
        if (accountInfo) {
          return accountInfo;
        } else {
          return _getEmptyAccountInfo(wallet);
        }
      } catch (e) {
        return _getEmptyAccountInfo(wallet);
      }
    }));
  },
});

module.exports = IndexerClient;
