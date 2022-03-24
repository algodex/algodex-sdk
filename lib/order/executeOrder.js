const algodex = require('../functions/base.js');
const signingApi = require('../wallet/signing_api.js');
const deprecate = require('../utils/deprecate');


const ExecuteOrder = {

  /**
   * Executes a limit order as a taker and submits it to the blockchain
   *
   * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
   * @param {Boolean} isSellingASA_AsTakerOrder: boolean true if the taker is selling the ASA to an ALGO-only escrow buy order
   * @param {Number}                    assetId: Algorand ASA ID for the asset.
   * @param {String}            takerWalletAddr: public address of the taker's wallet address
   * @param {Number}                 limitPrice: price of the base unit ASA in terms of microALGO
   * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
   * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
   * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
   * @return {Object} Promise for when the batched transaction(s) are fully confirmed
   * @deprecated
   */
  executeOrderAsTaker: async function(algodClient, isSellingASA_AsTakerOrder, assetId,
      takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector) {
    const {
      params,
      allTransList,
    } = await algodex.structureOrder(algodClient, isSellingASA_AsTakerOrder, assetId,
        takerWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);


    if (!!walletConnector && walletConnector.connector.connected) {
      const signedGroupTransactions = await signingApi.signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
      const confirmedWalletConnectArr = await signingApi.propogateTransactions(algodClient, signedGroupTransactions);
      return confirmedWalletConnectArr;
    } else {
      const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(allTransList);
      const confirmedMyAlgoWalletArr = await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
      return confirmedMyAlgoWalletArr;
    }
  },
  /**
   * Executes a market order as a taker and submits it to the blockchain
   *
   * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
   * @param {Boolean} isSellingASA_AsTakerOrder: boolean true if the taker is selling the ASA to an ALGO-only escrow buy order
   * @param {Number}                    assetId: Algorand ASA ID for the asset.
   * @param {String}            takerWalletAddr: public address of the taker's wallet address
   * @param {Number}                 currentMarketPrice: market price of the base unit ASA in terms of microALGO
   * @param {Number}                 worstAcceptablePrice: price of the base unit ASA in terms of microALGO after accounting for tolerance
   * @param {Number}                 tolerance: float from 0-1
   * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
   * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
   * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
   * @returns {Object} Promise for when the batched transaction(s) are fully confirmed
   * @deprecated
   */

  executeMarketOrderAsTaker: async function(algodClient, isSellingASA_AsTakerOrder, assetId,
      takerWalletAddr, currentMarketPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector, tolerance = .20) {
    const worstAcceptablePrice = isSellingASA_AsTakerOrder ? currentMarketPrice * (1 - tolerance) : currentMarketPrice * (1 + tolerance);

    const {
      params,
      allTransList,
    } = await algodex.structureOrder(algodClient, isSellingASA_AsTakerOrder, assetId,
        takerWalletAddr, worstAcceptablePrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, false, walletConnector);

    if (!!walletConnector && walletConnector.connector.connected) {
      const signedGroupTransactions = await signingApi.signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
      const confirmedWalletConnectArr = await signingApi.propogateTransactions(algodClient, signedGroupTransactions);
      return confirmedWalletConnectArr;
    } else {
      const singedGroupedTransactions = await signingApi.signMyAlgoTransactions(allTransList);
      const confirmedMyAlgoWalletArr = await signingApi.propogateTransactions(algodClient, singedGroupedTransactions);
      return confirmedMyAlgoWalletArr;
    }
  },

  /**
   * Executes a limit order as a maker and taker and submits it to the blockchain
   *
   * @param {Object}                algodClient: object that has been initialized via initAlgodClient()
   * @param {Boolean}              isSellingASA: boolean true if the user is selling the ASA
   * @param {Number}                    assetId: Algorand ASA ID for the asset.
   * @param {String}            userWalletAddr: public address of the taker/maker's wallet address
   * @param {Number}                 limitPrice: price of the base unit ASA in terms of microALGO
   * @param {Number}           orderAssetAmount: Must be integer. max amount of the asset to buy or sell in base units
   * @param {Number}            orderAlgoAmount: Must be integer. max amount of algo to buy or sell in microAlgos
   * @param {Object[]}       allOrderBookOrders: Array of objects each created via createOrderBookEntryObj
   * @returns {Object} Promise for when the batched transaction(s) are fully confirmed
   * @deprecated
   */

  executeOrderAsMakerAndTaker: async function(algodClient, isSellingASA, assetId,
      userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, walletConnector) {
    const {params, allTransList} = await algodex.structureOrder(algodClient, isSellingASA, assetId,
        userWalletAddr, limitPrice, orderAssetAmount, orderAlgoAmount, allOrderBookOrders, true, walletConnector);

    if (!!walletConnector && walletConnector.connector.connected) {
      const signedGroupTransactions = await signingApi.signWalletConnectTransactions(algodClient, allTransList, params, walletConnector);
      const confirmedWalletConnectArr = await signingApi.propogateTransactions(algodClient, signedGroupTransactions);
      return confirmedWalletConnectArr;
    } else {
      const signedGroupedTransactions = await signingApi.signMyAlgoTransactions(allTransList);
      const confirmedMyAlgoWalletArr = await signingApi.propogateTransactions(algodClient, signedGroupedTransactions);
      return confirmedMyAlgoWalletArr;
    }
  },

  /**
   * @deprecated
   */
  closeOrderFromOrderBookEntry: algodex.closeOrderFromOrderBookEntry,

  /**
   * Maker order to create a new algo-only escrow account and order book entry
   * Note: use getNumeratorAndDenominatorFromPrice() to get the n and d values.
   *
   * @param {Object}     algodClient: object that has been initialized via initAlgodClient()
   * @param {String} makerWalletAddr: external wallet address of the user placing the order. Used to sign with My Algo
   * @param {Number}               n: numerator   of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
   * @param {Number}               d: denominator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
   * @param {Number}         assetId: Algorand ASA ID for the asset.
   * @param {Number}   algoOrderSize: size of the order in terms of algos
   * @returns {Object} Promise for when the transaction is fully confirmed
   * @deprecated
   */

  placeAlgosToBuyASAOrderIntoOrderbook: function(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, walletConnector) {
    return algodex.getPlaceAlgosToBuyASAOrderIntoOrderbookV2(algodClient, makerWalletAddr, n, d, min, assetId, algoOrderSize, true, walletConnector);
  },

  /**
   * Maker order to create a new algo-only escrow account and order book entry
   * Note: use getNumeratorAndDenominatorFromPrice() to get the n and d values.
   *
   * @param {String} makerWalletAddr: external wallet address of the user placing the order. Used to sign with My Algo
   * @param {Number}               n: numerator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
   * @param {Number}               d: denominator of the price ratio. Must be an integer. d/n is the ASA price in terms of algos.
   * @param {Number}             min: minimum execution amount size. Should always be set to 0 (for the time being).
   * @param {Number}         assetId: Algorand ASA ID for the asset.
   * @returns {Object} Promise for when the transaction is fully confirmed
   * @deprecated
   */

  placeASAToSellASAOrderIntoOrderbook: function(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, walletConnector) {
    return algodex.getPlaceASAToSellASAOrderIntoOrderbookV2(algodClient, makerWalletAddr, n, d, min, assetId, assetAmount, true, walletConnector);
  },

};

/**
 * Export of deprecated functions
 */
Object.keys(ExecuteOrder).forEach((key) => {
  ExecuteOrder[key] = deprecate(ExecuteOrder[key], {file: 'executeOrder.js'});
});

module.exports = ExecuteOrder;
