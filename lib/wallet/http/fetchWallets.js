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
 * @param {*} accountAddr
 * @param {*} returnEmptyAccount
 * @return {Promise<Object>}
 */
async function _getAccountInfo({
  uri,
  port,
  token,
}, accountAddr, returnEmptyAccount = true) {
  try {
    const response = await axios.get(uri + port +
      '/v2/accounts/' + accountAddr, {headers: {'X-Algo-API-Token': token}});
    if (response.data && response.data.account) {
      return response.data.account;
    } else if (returnEmptyAccount) {
      return _getEmptyAccountInfo(accountAddr);
    } else {
      return null;
    }
  } catch (e) {
    if (returnEmptyAccount) {
      return _getEmptyAccountInfo(accountAddr);
    }
    return null;
  }
}

/**
 *
 * @param addresses
 * @return {Promise<{}|{wallets: Awaited<unknown>[]}>}
 */
async function fetchWallets(addresses) {
  if (addresses.length === 0) {
    return {};
  }
  const promises = addresses.map(async (address) => {
    try {
      const accountInfo = await _getAccountInfo(address);
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
