const algodex = require('../AlgodexApi.js')
const convert = require('./convert.js')
// import { convertFromBaseUnits } from './convert'
// import { getAlgodexEnvironment } from './environment'
// import { truncateAddress } from './display'
/*
 * Returns walletService object with necessary methods for wallet retrieval and interaction with frontend
 * @param {Object}         AlgodClient: instance of AlgodClient needed for order Execution
 * @param {String}         address: address of the target wallet
 * @returns {Object} Promise for when the wallet returns?
 */
// function WalletService({config}) {
//      this.client = config.sdk || setClient(config)
// }
/**
 * @deprecated
 * @param algodex_environment
 * @constructor
 */
function WalletService(
  algodex_environment,
) {
  if (!new.target) {
    throw Error("Cannot be called without the new keyword");
  }
  this.getMinWalletBalance = algodex.getMinWalletBalance;

  this.fetchWallets = async (addresses) => {


    if (addresses.length === 0) {
      return {}
    }

    algodex.initIndexer(algodex_environment)

    const getEmptyAccountInfo = (address) => {
      return {
        "address": address,
        "amount": 0, "amount-without-pending-rewards": 0, "apps-local-state": [],
        "apps-total-schema": { "num-byte-slice": 0, "num-uint": 0 }, "assets": [],
        "created-apps": [], "created-assets": [], "pending-rewards": 0,
        "reward-base": 0, "rewards": 0, "round": -1, "status": "Offline"
      }
    }

    const promises = addresses.map(async (address) => {
      try {
        const accountInfo = await algodex.getAccountInfo(address)
        if (accountInfo) {
          return this.setWalletData(accountInfo)
        } else {
          const emptyAccountInfo = getEmptyAccountInfo(address)
          return this.setWalletData(emptyAccountInfo)
        }
      } catch (e) {
        const emptyAccountInfo = getEmptyAccountInfo(address)
        return this.setWalletData(emptyAccountInfo)
      }

    })

    const wallets = await Promise.all(promises)

    return {
      wallets
    }

  };

  this.setWalletData = (accountInfo) => {
    const truncateAddress = (addr) => {
      return `${addr.substr(0, 4)}...${addr.substr(addr.length - 4)}`
    }
    if (accountInfo.assets === undefined) {
      accountInfo.assets = []
    }

    return {
      address: accountInfo.address,
      name: truncateAddress(accountInfo.address),
      balance: convert.convertFromBaseUnits(accountInfo.amount),
      assets: accountInfo.assets.reduce(
        (result, asset) => ({
          ...result,
          [asset['asset-id']]: {
            balance: convert.convertFromBaseUnits(asset.amount)
          }
        }),
        {}
      )
    }
  }
}

module.exports = WalletService;
