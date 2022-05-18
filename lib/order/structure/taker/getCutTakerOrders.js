const algosdk = require('algosdk');
const AlgodError = require('../../../error/AlgodError');
const logger = require('../../../logger');

const withLogicSigAccount = require('../../compile/withLogicSigAccount');
const withExecuteAssetTxns = require('../../txns/sell/withExecuteAssetTxns');
const withExecuteAlgoTxns = require('../../txns/buy/withExecuteAlgoOrderTxns');

const BigN = require('js-big-decimal');

const LESS_THAN = -1;
const GREATER_THAN = 1;

/**
 *
 * @param {*} orderBookEscrowEntry
 * @param {*} takerCombOrderBalance
 * @return {Object}
 */
function getExecuteAlgoOrderTakerTxnAmounts(
    orderBookEscrowEntry,
    takerCombOrderBalance,
) {
  logger.debug({orderBookEscrowEntry, takerCombOrderBalance}, 'orderBookEscrowEntry, takerCombOrderBalance');

  const orderCreatorAddr = orderBookEscrowEntry['orderCreatorAddr'];
  const orderBookEntry = orderBookEscrowEntry['orderEntry'];
  const currentEscrowAlgoBalance = orderBookEscrowEntry['algoBalance'];
  let algoAmountReceiving = orderBookEscrowEntry['algoBalance'];
  const assetId = orderBookEscrowEntry['assetId'];
  const takerAddr = takerCombOrderBalance['takerAddr'];

  logger.debug('assetid: ' + assetId);

  const orderBookEntrySplit = orderBookEntry.split('-');
  const n = orderBookEntrySplit[0];
  const d = orderBookEntrySplit[1];

  const appAccts = [];
  appAccts.push(orderCreatorAddr);
  appAccts.push(takerAddr);
  // Call stateful contract

  const txnFee = 0.002 * 1000000;

  algoAmountReceiving -= txnFee; // this will be the transfer amount
  logger.debug('here1');
  logger.debug('takerOrderBalance: ' + toString(takerCombOrderBalance));
  logger.debug('algoAmount: ' + algoAmountReceiving);

  const price = new BigN(d).divide(new BigN(n), 30);
  const bDecOne = new BigN(1);

  const emptyReturnVal = {
    'algoAmountReceiving': 0,
    'asaAmountSending': 0,
    'txnFee': 0,
  };

  if (algoAmountReceiving <= 0) {
    logger.debug('here5');
    logger.debug('can\'t afford, returning early');
    return emptyReturnVal; // can't afford any transaction!
  }
  algoAmountReceiving = new BigN(algoAmountReceiving);
  let asaAmount = algoAmountReceiving.divide(price, 30);
  logger.debug('here6');
  logger.debug('asa amount: ' + asaAmount.getValue());

  let hasSpecialCaseOkPrice = false;
  if (asaAmount.getValue().includes('.') &&
        asaAmount.compareTo(bDecOne) === LESS_THAN) {
    // Since we can only sell at least one unit, figure out the 'real' price we are selling at,
    // since we will need to adjust upwards the ASA amount to 1, giving a worse deal for the seller (taker)
    const adjPrice = asaAmount.multiply(price);
    const takerLimitPrice = new BigN(takerCombOrderBalance['limitPrice']);
    logger.debug('here6a2 figuring out adjusted price for hasSpecialCaseGoodPrice',
        {adjPrice, asaAmount, price, takerLimitPrice});

    if (adjPrice.compareTo(takerLimitPrice) === GREATER_THAN) {
      hasSpecialCaseOkPrice = true;
    }
  }

  if (asaAmount.getValue().includes('.') &&
        asaAmount.compareTo(bDecOne) === LESS_THAN && hasSpecialCaseOkPrice) {
    logger.debug('here6aa asa less than one, changing ASA amount to 1');
    asaAmount = bDecOne;
    algoAmountReceiving = price.multiply(bDecOne);
    if (algoAmountReceiving.getValue().includes('.')) {
      // give slightly worse deal for taker if decimal
      algoAmountReceiving = algoAmountReceiving.floor();
      logger.debug('here6aa decreasing algoAmount due to decimal: ' + algoAmountReceiving.getValue());
    }
    if (new BigN(currentEscrowAlgoBalance).compareTo(algoAmountReceiving) === LESS_THAN) {
      algoAmountReceiving = new BigN(currentEscrowAlgoBalance);
    }

    algoAmountReceiving = algoAmountReceiving.subtract(new BigN(0.002 * 1000000)); // reduce for fees
  } else if (asaAmount.getValue().includes('.')) {
    // round down decimals. possibly change this later?
    asaAmount = asaAmount.floor();

    logger.debug('here7');
    logger.debug('increasing from decimal asa amount: ' + asaAmount.getValue());

    // recalculating receiving amount
    // use math.floor to give slightly worse deal for taker
    algoAmountReceiving = asaAmount.multiply(price).floor();
    logger.debug('recalculating receiving amount to: ' + algoAmountReceiving.getValue());
  }

  if (new BigN(takerCombOrderBalance['asaBalance']).compareTo(asaAmount) === LESS_THAN) {
    logger.debug('here8');
    logger.debug('here8 reducing asa amount due to taker balance: ', asaAmount.getValue());
    asaAmount = new BigN(takerCombOrderBalance['asaBalance']);
    logger.debug('here8 asa amount is now: ', asaAmount.getValue());

    algoAmountReceiving = price.multiply(asaAmount);
    logger.debug('here9');
    logger.debug('recalculating algoamount: ' + algoAmountReceiving.getValue());
    if (algoAmountReceiving.getValue().includes('.')) {
      // give slightly worse deal for taker if decimal
      algoAmountReceiving = algoAmountReceiving.floor();
      logger.debug('here10 increasing algoAmount due to decimal: ' + algoAmountReceiving.getValue());
    }
  }

  logger.debug('almost final ASA amount: ' + asaAmount.getValue());

  // These are expected to be integers now
  algoAmountReceiving = parseInt(algoAmountReceiving.getValue());
  asaAmount = parseInt(asaAmount.getValue());

  algoAmountReceiving = Math.max(0, algoAmountReceiving);

  return {
    'algoAmountReceiving': algoAmountReceiving,
    'asaAmountSending': asaAmount,
    'txnFee': txnFee,
  };
}
/**
 *
 * @param {*} takerCombOrderBalance
 * @param {*} orderBookEscrowEntry
 * @return {Object}
 */
function getExecuteASAOrderTakerTxnAmounts(
    takerCombOrderBalance,
    orderBookEscrowEntry,
) {
  logger.debug('printing!!!');
  logger.debug({takerCombOrderBalance, orderBookEscrowEntry});

  const orderBookEntry = orderBookEscrowEntry['orderEntry'];
  const min_asa_balance = 0;

  // 1000000-250000-0-15322902
  // n-d-minOrderSize-assetId
  const orderBookEntrySplit = orderBookEntry.split('-');
  const n = orderBookEntrySplit[0];
  const d = orderBookEntrySplit[1];

  let escrowAsaTradeAmount = orderBookEscrowEntry['asaBalance'];
  const currentEscrowASABalance = orderBookEscrowEntry['asaBalance'];
  const price = new BigN(d).divide(new BigN(n), 30);
  const bDecOne = new BigN(1);
  const executionFees = 0.004 * 1000000;
  let closeoutFromASABalance = true;
  escrowAsaTradeAmount = new BigN(escrowAsaTradeAmount);
  let algoTradeAmount = price.multiply(escrowAsaTradeAmount);
  if (algoTradeAmount.getValue().includes('.')) {
    algoTradeAmount = algoTradeAmount.floor().add(bDecOne); // round up to give seller more money
  }
  // FIXME - check if lower than order balance
  const maxTradeAmount = Math.min(takerCombOrderBalance['algoBalance'], takerCombOrderBalance['walletAlgoBalance'] - executionFees);
  const emptyReturnVal = {
    'algoTradeAmount': 0,
    'escrowAsaTradeAmount': 0,
    'executionFees': 0,
    'closeoutFromASABalance': false,
  };

  if (algoTradeAmount.compareTo(new BigN(maxTradeAmount)) == GREATER_THAN &&
        algoTradeAmount.compareTo(bDecOne) == GREATER_THAN &&
        algoTradeAmount.subtract(new BigN(maxTradeAmount)).compareTo(bDecOne) == GREATER_THAN) {
    logger.debug('here999a reducing algoTradeAmount, currently at: ' + algoTradeAmount.getValue());
    algoTradeAmount = new BigN(maxTradeAmount);
    escrowAsaTradeAmount = algoTradeAmount.divide(price, 30);
    logger.debug('checking max: ' + escrowAsaTradeAmount.getValue() + ' ' + 1);
    if (escrowAsaTradeAmount.compareTo(bDecOne) == LESS_THAN) { // don't allow 0 value
      escrowAsaTradeAmount = bDecOne;
    }
    logger.debug('here999b reduced to algoTradeAmount escrowAsaAmount', algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());

    if (escrowAsaTradeAmount.getValue().includes('.')) {
      // round ASA amount
      escrowAsaTradeAmount = escrowAsaTradeAmount.floor();
      algoTradeAmount = price.multiply(escrowAsaTradeAmount);
      if (algoTradeAmount.getValue().includes('.')) {
        algoTradeAmount = algoTradeAmount.floor().add(bDecOne); // round up to give seller more money
        logger.debug('here999bc increased algo to algoTradeAmount escrowAsaAmount', algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
      }
      logger.debug('here999c changed to algoTradeAmount escrowAsaAmount', algoTradeAmount.getValue(), escrowAsaTradeAmount.getValue());
    }
  } // FIXME: factor in fees?

  if (new BigN(currentEscrowASABalance).subtract(escrowAsaTradeAmount)
      .compareTo(new BigN(min_asa_balance)) == GREATER_THAN) {
    logger.debug('asa escrow here9992 (currentASABalance - escrowAsaAmount) > min_asa_balance',
        currentEscrowASABalance, escrowAsaTradeAmount.getValue(), min_asa_balance);
    closeoutFromASABalance = false;
  }

  if (takerCombOrderBalance['walletAlgoBalance'] < executionFees + parseInt(algoTradeAmount.getValue())) {
    logger.debug('here9992b algo balance too low, returning early! ', executionFees, algoTradeAmount.getValue(), takerCombOrderBalance);
    return emptyReturnVal; // no balance left to use for buying ASAs
  }

  escrowAsaTradeAmount = parseInt(escrowAsaTradeAmount.getValue());
  algoTradeAmount = parseInt(algoTradeAmount.getValue());

  if (escrowAsaTradeAmount <= 0) {
    logger.debug('here77zz escrowAsaTradeAmount is at 0 or below. returning early! nothing to do');
    return emptyReturnVal;
  }
  if (algoTradeAmount <= 0) {
    logger.debug('here77zb algoTradeAmount is at 0 or below. returning early! nothing to do');
    return emptyReturnVal;
  }

  // FIXME - need more logic to transact correct price in case balances dont match order balances
  logger.debug('closeoutFromASABalance: ' + closeoutFromASABalance);

  logger.debug('almost final amounts algoTradeAmount escrowAsaAmount ', algoTradeAmount, escrowAsaTradeAmount);
  // algoTradeAmount = algoTradeAmount / 2;

  logger.debug('n: ', n, ' d: ', d, ' asset amount: ', escrowAsaTradeAmount);

  return {
    'algoTradeAmount': algoTradeAmount,
    'escrowAsaTradeAmount': escrowAsaTradeAmount,
    'executionFees': executionFees,
    'closeoutFromASABalance': closeoutFromASABalance,
  };
}
/**
 *
 * @param {*} order
 * @return {Promise<Txns>}
 */

/**
 * ## ✉ composeQueuedOrderWithTakerInfo
 *
 * @param {Object} compileObj Compile object
 * @param {Object} takerOrderBalance Object Of Order And Wallet amounts
 * @param {Object} queuedOrder Object Of Order And Wallet amounts
 *
 * @return {Object} Object containing properly formatted composition of cutQueuedOrder and takerBalance for constructing
 * single transList
 * @memberOf module:order/structures
 */
function withQueuedOrder(order, queuedOrder) {
  const {takerOrderBalance} = order;
  if (takerOrderBalance.isExecuteASA) {
    return {
      ...order,
      address: order.address,
      client: order.client,
      contract: {
        ...order.contract,
        escrow: queuedOrder.escrowAddr,
        creator: queuedOrder.orderCreatorAddr,
        entry: queuedOrder.orderEntry,
        params: order.params,
        total: takerOrderBalance.algoTradeAmount, // equivalent to algoamount sending
        amount: takerOrderBalance.escrowASATradeAmount,

      },


      price: queuedOrder.price, // want to use the price of the escrow order and not the limit price
      // asset: {
      //   id: order.asset.id,
      // }, //I don't think we need this
      shouldClose: queuedOrder.forceShouldClose,
      takerIsOptedIn: takerOrderBalance.takerIsOptedIn,
      orderBookEscrowEntry: queuedOrder,
    };
  } else {
    return {
      ...order,
      address: order.address,
      client: order.client,

      contract: {
        ...order.contract,
        escrow: queuedOrder.escrowAddr,
        creator: queuedOrder.orderCreatorAddr,
        entry: queuedOrder.orderEntry, // want to use the entry of the escrow order and not the user entry
        params: order.params,
        // algoAmountSending: takerOrderBalance.algoTradeAmount, //Buying asset
        amount: takerOrderBalance.asaAmountSending,

      },

      price: queuedOrder.price, // want to use the price of the escrow order and not the limit price

      appId: order.appId,
      shouldClose: queuedOrder.forceShouldClose,
      takerIsOptedIn: takerOrderBalance.takerIsOptedIn,
      orderBookEscrowEntry: queuedOrder,
    };
  }
}
/**
 * ## ✉ withStructureSingleTransListWithGroupOrder
 * takes a queued order object and returns a new object that has cutOrdertTimes
 * logic if needed
 *
 * @todo Remove mutations to allTransList and return a new array
 * @param {Array} singleOrderTransList Array of cut transactions
 * @param {Array} allTransList Array of all transactions
 * @param {Number} txOrderNum Object Of Order And Wallet amounts
 * @param {Number} groupNum Object Of Order And Wallet amounts
 *
 * @return {Number} returns number to persist txOrderNum for outerloop
 * @memberOf module:order/structures
 */
function getTxnOrderNumber(singleOrderTransList, allTransList, txOrderNum, groupNum) {
  if (!Array.isArray(singleOrderTransList) || !Array.isArray(allTransList)) throw new TypeError('TransLists must be arrays');
  if (singleOrderTransList.length < 1) throw new Error('singleOrderTransList must not be empty');
  for (let k = 0; k < singleOrderTransList.length; k++) {
    const trans = singleOrderTransList[k];
    trans['txOrderNum'] = txOrderNum;
    trans['groupNum'] = groupNum;
    txOrderNum++;
    allTransList.push(trans); // perhaps not the best practice but works well with the for loop
  }
  return txOrderNum;
}

/**
 * ## ✉ updateTakerBalance
 * takes a queued order object and taker balance object and returns the balance after
 * the ith iteration
 * @param {Object} queuedOrder Object Of Order And Wallet amounts
 * @param {Object} takerOrderBalance Object Of Order And Wallet amounts
 *
 * @return {Object} Object containing new takerOrderBalance
 * @memberOf module:order/structures
 */
function updateTakerBalance(queuedOrder, takerOrderBalance, isAsaEscrow) {
  if (isAsaEscrow) {
    const {
      algoTradeAmount,
      escrowAsaTradeAmount,
      executionFees,
      closeoutFromASABalance: initialCloseoutFromASABalance,
    } = getExecuteASAOrderTakerTxnAmounts(
        takerOrderBalance,
        queuedOrder,
    );


    if (algoTradeAmount === 0) return 'escrowEmpty';
    let closeoutFromASABalance = initialCloseoutFromASABalance;

    if (queuedOrder.useForceShouldCloseOrNot) {
      closeoutFromASABalance = queuedOrder.forceShouldClose;
    }


    takerOrderBalance['algoBalance'] -= executionFees;
    takerOrderBalance['algoBalance'] -= algoTradeAmount;
    takerOrderBalance['walletAlgoBalance'] -= executionFees;
    takerOrderBalance['walletAlgoBalance'] -= algoTradeAmount;
    takerOrderBalance['asaBalance'] += escrowAsaTradeAmount;
    takerOrderBalance['walletASABalance'] += escrowAsaTradeAmount;
    takerOrderBalance['algoTradeAmount'] = algoTradeAmount;
    takerOrderBalance['escrowASATradeAmount'] = escrowAsaTradeAmount;
    takerOrderBalance['isExecuteASA'] = true;
    takerOrderBalance['closeOutFromASA'] = closeoutFromASABalance;


    return takerOrderBalance;
  } else {
    const {algoAmountReceiving, asaAmountSending, txnFee} =
            getExecuteAlgoOrderTakerTxnAmounts(queuedOrder, takerOrderBalance);

    if (algoAmountReceiving === 0) {
      console.debug('algoAmountReceiving is 0, nothing to do, returning early');
      return 'escrowEmpty';
    }

    takerOrderBalance['algoBalance'] -= txnFee;
    takerOrderBalance['algoBalance'] += algoAmountReceiving;
    takerOrderBalance['asaBalance'] -= asaAmountSending;
    takerOrderBalance['asaAmountSending'] = asaAmountSending;
    takerOrderBalance['algoAmountReceiving'] = algoAmountReceiving;
    takerOrderBalance['isExecuteAsa'] = false;


    return takerOrderBalance;
  }
}

/**
 * ## ✉ withDetermineFinaleOrderAndWalletAmounts
 * takes a queued order object and returns a new object that has cutOrdertTimes
 * logic if needed
 *
 * @param {Object} cutQueuedOrderObject Object Of Order And Wallet amounts
 * @return {Object} Object containing queued order after being cut
 * @memberOf module:order/structures
 */
function getCutQueuedOrder(cutQueuedOrderObject) {
  const {queuedOrder, cutOrder, splitTimes, loopIndex, runningBalance} = cutQueuedOrderObject;
  const cutQueuedOrder = Object.assign({}, queuedOrder);

  if (cutOrder != null) {
    const shouldClose = (loopIndex >= cutOrder.splitTimes - 1);
    const useForceShouldCloseOrNot = (loopIndex < cutOrder.splitTimes - 1);
    cutQueuedOrder.forceShouldClose = shouldClose;
    cutQueuedOrder.useForceShouldCloseOrNot = useForceShouldCloseOrNot;
    cutQueuedOrder.txnNum = loopIndex;

    if (loopIndex >= splitTimes - 1) {
      // This is the last iteration, so simply use the running balance
      if (cutQueuedOrder.isASAEscrow) {
        cutQueuedOrder.asaBalance = runningBalance;
      } else {
        cutQueuedOrder.algoBalance = runningBalance;
      }
    } else {
      if (cutQueuedOrder.isASAEscrow) {
        cutQueuedOrder.asaBalance = Math.min(
            cutOrder.cutOrderAmount,
            runningBalance,
        );
      } else {
        cutQueuedOrder.algoBalance = Math.min(
            cutOrder.cutOrderAmount,
            runningBalance,
        );
      }
    }
  }

  return cutQueuedOrder;
}

/**
 * @param {Object} queuedOrder
 * @return {object}
 */
function getCutOrderTimes(queuedOrder) {
  logger.debug('in getCutOrderTimes: ', JSON.stringify(queuedOrder));
  let cutOrderAmount = null; let splitTimes = null;
  if (queuedOrder.isASAEscrow) {
    cutOrderAmount = Math.max(1, queuedOrder.asaBalance / 4);
    splitTimes = Math.floor(queuedOrder.asaBalance / cutOrderAmount);
  } else {
    const minOrderAmount = Math.max(queuedOrder.price + 1, 500000);
    cutOrderAmount = Math.max(minOrderAmount, queuedOrder.algoBalance / 4);
    splitTimes = Math.floor(queuedOrder.algoBalance / cutOrderAmount);
  }
  cutOrderAmount = Math.floor(cutOrderAmount);

  if (splitTimes === 0) {
    splitTimes = 1;
  }

  return {
    'cutOrderAmount': cutOrderAmount,
    'splitTimes': splitTimes,
  };
}
/**
 * ## ✉ getRunningBalance
 * Validates and returns algoWalletAmount associated
 * with an account
 *
 * @param {Account} queuedOrder order in current iteration of the structure loop

 * @return {Number} Asset or Algo balance of order
 * @memberOf module:order/structures
 */
function getRunningBalance(queuedOrder) {
  if (typeof queuedOrder.isASAEscrow === 'undefined') {
    throw new TypeError('Invalid isASAEscrow Flag');
  }
  if (typeof queuedOrder.algoBalance === 'undefined') {
    throw new TypeError('Invalid Algobalance');
  }

  return queuedOrder.isASAEscrow ?
        queuedOrder.asaBalance :
        queuedOrder.algoBalance;
}


/**
 * ## ✉ getStructureLoopCheck
 * Validates and returns algoWalletAmount associated
 * with an account
 *
 * @param {TakerInformation} takerOrderBalance orderBalanceObject of executor
 * @param {boolean} isSellingASA
 * @param {number} price
 * @return {boolean}
 * @memberOf module:order/structures
 */
function getStructureLoopCheck(takerOrderBalance, isSellingASA, price) {
  const takerMissingProps = !(Object.prototype.hasOwnProperty.call(takerOrderBalance, 'walletAlgoBalance') &&
        Object.prototype.hasOwnProperty.call(takerOrderBalance, 'asaBalance') &&
        Object.prototype.hasOwnProperty.call(takerOrderBalance, 'algoBalance') &&
        Object.prototype.hasOwnProperty.call(takerOrderBalance, 'limitPrice')
  );


  if (takerMissingProps) {
    throw new Error('invalid orderBalance object');
  }


  if (isSellingASA && parseFloat(takerOrderBalance['asaBalance']) <= 0) {
    logger.debug('breaking due to 0 asaBalance balance!');

    return false;
  }
  if (!isSellingASA && parseFloat(takerOrderBalance['algoBalance']) <= 0) {
    logger.debug('breaking due to 0 algoBalance balance!');
    return false;
  }

  if (isSellingASA && takerOrderBalance['limitPrice'] > price) {
    logger.debug('breaking because queuedOrder price is lower than taker sellPrice');

    return false;
  }
  if (!isSellingASA && parseFloat(takerOrderBalance['limitPrice']) < price) {
    logger.debug('breaking because queuedOrder price is higher than taker buy price');
    return false;
  }


  return true;
}

/**
 * ## ✉ withGetSplitTimesByIter
 * calculates cutOrder and splitTimes
 *
 * @param {Object} walletAndOrderAmountObj Object Of Order And Wallet amounts
 * @param {Number} loopIndex index of structure loop
 * @return {Object} Object containing splitTimes and cutOrder properties
 * @memberOf module:order/structures
 */
function getSplitTimesByIter(queueOrder, loopIndex) {
  let cutOrder = null;
  let splitTimes = 1;
  if (loopIndex === 0) {
    cutOrder = getCutOrderTimes(queueOrder);
    splitTimes = cutOrder.splitTimes;
  } else {
    cutOrder = null;
  }
  logger.debug('cutOrder, splitTimes: ', {cutOrder, splitTimes});
  return {cutOrder, splitTimes};
}

/**
 * ## ✉ makeCutTakerTxns
 * Accepts takerOrderBalance and a queuedOrders array
 * and determines the final structure of takerTxns
 * will sometimes be a batch of smaller transactions
 * whose sum is equal to the user inputted amount
 *
 * @param {Object} order The User's Order
 *
 * @return {Object} An object with array of taker transactions which as a whole represents the taker side .
 * @memberOf module:order/structures
 */
async function getCutTakerOrders(order) {
  if (!(order.client instanceof algosdk.Algodv2)) {
    throw new AlgodError('Order must have a valid SDK client');
  }

  if (typeof order.appId !== 'number') {
    throw new TypeError('Must have valid Application Index');
  }

  if (typeof order.contract !== 'undefined' && typeof order.contract.entry !== 'string') {
    throw new TypeError('Order must have a valid contract state with an entry!');
  }

  // Currently Breaking because we are no longer returning an orderObject with the takerORderBalance attached, we are just returning the takerBalance
  if (typeof order.takerOrderBalance === 'undefined') {
    throw new TypeError('Must have a takerOrderBalance object property attached to the Order Object');
  }

  if (!Array.isArray(order.asset.queuedOrders)) {
    throw new TypeError('Must have an array of queuedOrders attached to order.asset');
  }

  const {
    asset: {
      queuedOrders,
    },
  } = order;
  const _isSellingAsset = order.type === 'sell';

  let txOrderNum = 0;
  let groupNum = 0;
  let lastExecutedPrice = -1;
  const allTransList = [];


  for (let i = 0; i < queuedOrders.length; i++) {
    if (!getStructureLoopCheck(
        order.takerOrderBalance,
        _isSellingAsset,
        queuedOrders[i]['price'])) {
      break;
    }

    const {cutOrder, splitTimes} = getSplitTimesByIter(queuedOrders[i], i);

    let runningBalance = getRunningBalance(queuedOrders[i]);

    let outerBreak = false;
    for (let jj = 0; jj < splitTimes; jj++) {
      if (runningBalance <= 0) {
        throw new Error('Unexpected 0 or below balance');
      }
      logger.debug(
          'running balance: ' +
                runningBalance +
                ' isASAEscrow: ' +
                queuedOrders[i].isASAEscrow,
      );

      const cutQueuedOrderObject = {
        queuedOrder: queuedOrders[i],
        cutOrder: cutOrder,
        splitTimes: splitTimes,
        loopIndex: jj,
        runningBalance: runningBalance,
      };

      const queuedOrder = getCutQueuedOrder(cutQueuedOrderObject);

      const queuedOrderForLsig = {
        min: queuedOrder.min,
        contract: {
          N: queuedOrder.n,
          D: queuedOrder.d,
        },

        version: queuedOrder.version,
        address: queuedOrder.orderCreatorAddr,
        type: queuedOrder.escrowOrderType,
        asset: {id: queuedOrder.assetId},
        appId: order.appId,
        client: order.client,

      };


      const escrowLsig = await withLogicSigAccount(queuedOrderForLsig);
      order.contract.escrow = escrowLsig.contract.escrow;
      order.contract.lsig = escrowLsig.contract.lsig;


      const updatedTakerOrderBalance = updateTakerBalance(queuedOrder, order.takerOrderBalance, queuedOrder.isASAEscrow);
      if (updatedTakerOrderBalance === 'escrowEmpty') {
        outerBreak = true;
        break;
      }

      order = {
        ...order,
        takerOrderBalance: {
          ...updatedTakerOrderBalance, // updateTakerOrderBalance returns the entire takerOrderBalanceObject
        },
      };

      //   singleOrderTransList changed per Michael and I's discussion
      // TODO: change the above logic to map queuedOrder to a compilable object.

      const singleOrderTransList =
                !queuedOrder.isASAEscrow ?
                    await withExecuteAlgoTxns(withQueuedOrder(order, queuedOrder), queuedOrder?.shouldClose) :
                    await withExecuteAssetTxns(withQueuedOrder(order, queuedOrder), queuedOrder?.shouldClose);


      if (singleOrderTransList == null) {
        // Overspending issue
        outerBreak = true;
        break;
      }

      // Taking out final price check for now because new paymentStructure does not append data found in v1 structures
      // const [algo, asa] = getAlgoandAsaAmounts(singleOrderTransList);


      // finalPriceCheck(algo, asa, takerOrderBalance.limitPrice, _isSellingAsset);

      lastExecutedPrice = queuedOrder['price'];
      // Be Warned: allTransList is persisted via a side effect
      txOrderNum = getTxnOrderNumber(
          singleOrderTransList, allTransList, txOrderNum, groupNum,
      ); // so next loop remembers total
      groupNum++;
      runningBalance -= cutOrder != null ? cutOrder.cutOrderAmount : 0;
    }
    if (outerBreak) {
      break;
    }
  }

  return allTransList;
}

module.exports = getCutTakerOrders;

if (process.env.NODE_ENV === 'test') {
  module.exports.getRunningBalance = getRunningBalance;
  module.exports.getStructureLoopCheck = getStructureLoopCheck;
  module.exports.getCutOrderTimes = getCutOrderTimes;
  module.exports.getCutQueuedOrder = getCutQueuedOrder;
  module.exports.getExecuteAlgoOrderTakerTxnAmounts = getExecuteAlgoOrderTakerTxnAmounts;
  module.exports.getExecuteASAOrderTakerTxnAmounts = getExecuteASAOrderTakerTxnAmounts;
  module.exports.getSplitTimesByIter = getSplitTimesByIter;
  module.exports.getTxnOrderNumber = getTxnOrderNumber;
}

