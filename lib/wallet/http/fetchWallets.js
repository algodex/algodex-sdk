const {default: axios} = require('axios');

const _getEmptyAccountInfo = (address) => {
  return {
    'address': address,
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
  };
};

/**
 *
 * @TODO: Refactor to use algosdk.Indexer or move to lib/http
 * @param {Config} config The configuration for the service
 * @param {*} account
 * @param {*} returnEmptyAccount
 * @return {Promise<Object>}
 */
async function _getAccountInfo(
    {
      indexer: {
        uri,
        port,
        token,
      },
    },
    account,
    returnEmptyAccount = true,
) {
  const portPath = typeof port === 'undefined' ? '' : `:${port}`;
  const urlPath = uri + portPath + '/v2/accounts/' + account.address;
  try {
    const response = await axios.get(urlPath, {headers: {'X-Algo-API-Token': token}});
    if (response.data && response.data.account) {
      return response.data.account;
    } else if (returnEmptyAccount) {
      return _getEmptyAccountInfo(account.address);
    } else {
      return null;
    }
  } catch (e) {
    if (returnEmptyAccount) {
      return _getEmptyAccountInfo(account.address);
    }
    return null;
  }
}

/**
 *
 * @param addresses
 * @return {Promise<{}|{wallets: Awaited<unknown>[]}>}
 */
async function fetchWallets(config, addresses) {
  if (addresses.length === 0) {
    return {};
  }
  const promises = addresses.map(async (address) => {
    try {
      const accountInfo = await _getAccountInfo(config, address, false);
      if (accountInfo) {
        return accountInfo;
      } else {
        return _getEmptyAccountInfo(address);
      }
    } catch (e) {
      return _getEmptyAccountInfo(address);
    }
  });

  const wallets = await Promise.all(promises);

  return {
    wallets,
  };
}

module.exports = fetchWallets;
