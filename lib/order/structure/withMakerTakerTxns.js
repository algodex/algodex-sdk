const algosdk = require('algosdk');
const AlgodError = require('../../error/AlgodError');
const withCutTakerTxns = require('./withCutTakerTxns');
const withMakerTxns = require('./withMakerTxns');
const withTakerOrderInformation = require('./withTakerOrderInformation');
const {getAccountInfo} = require('../../functions/base');
const getMinBalance = require('../../wallet/getMinBalance');
const getTakerOrderBalance = require('./getTakerOrderBalance');
const getQueuedOrders = require('./getQueuedOrders');


/**
     *
     * @param {*} algodClient
     * @param {*} isSellingASA
     * @param {*} assetId
     * @param {*} userWalletAddr
     * @param {*} limitPrice
     * @param {*} orderAssetAmount
     * @param {*} orderAlgoAmount
     * @param {*} allOrderBookOrders
     * @param {*} includeMaker
     * @param {*} walletConnector
     */
async function withMakerTakerTxns(order) {
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  if (typeof order.contract !== 'undefined' && typeof order.contract.entry !== 'string') {
    throw new TypeError('Order must have a valid contract state with an entry!');
  }

  const _accountInfo = await getAccountInfo(order.address);
  const _minBalance = getMinBalance(_accountInfo);

  const _includeMaker = order.execution !== 'taker';

  //   TODO: Keep the filtering of the orderbook and cutting of queuedOrders in the same place
  // change takerOrderInformaiton to getTakerOrderINformation
  // fetch accountInfo on the top level


  const _queuedOrders = getQueuedOrders(order);

  const takerOrderBalance = await getTakerOrderBalance(order, _accountInfo, _minBalance);


  const orderWithTakerTxns = await withCutTakerTxns(await withTakerOrderInformation(order));
  if (orderWithTakerTxns === undefined) { // taker loop ended early without returning object so use original order Object for maker
    return await withMakerTxns({...order, execution: 'maker'});
  }

  if (!_includeMaker) { // if it is taker only then just return the taker step
    return {
      ...orderWithTakerTxns,
      contract: {
        ...orderWithTakerTxns.contract,
        txns: orderWithTakerTxns.takerOrderBalance.allTransList,
      },
    };
  } else { // if it is both execution then add maker txns
    return await withMakerTxns({...orderWithTakerTxns, execution: 'maker'});
    // TODO: Talk to michael/ at least inform him that you need to mutate execution to maker in "both" mode if we want to use "makePlaceAssetTxns".
  }
}

module.exports = withMakerTakerTxns;


