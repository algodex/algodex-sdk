const args = require('minimist')(process.argv.slice(2));
const PouchDB = require('pouchdb');
const algosdk = require('algosdk');
const axios = require('axios');
const AlgodexAPI = require('../lib');
// const withCloseAssetOrderTxns = require('../lib/order/txns/close/withCloseAssetTxns');
// const withCloseAlgoOrderTxns = require('../lib/order/txns/close/withCloseAlgoTxns');
const { LogicSigAccount } = require('algosdk');

if (args.assetId !== undefined &&
    args.assetId.length === 0) {
  throw new Error('Views are missing!');
}
if (args.environment !== undefined &&
  args.environment.length === 0) {
  throw new Error('Views are missing!');
}

const minSpreadPerc = 0.01 // FIXME
const nearestNeighborKeep = 0.005 //FIXME
// const escrowDB = new PouchDB('escrows');
const escrowDB = new PouchDB('http://admin:dex@127.0.0.1:5984/market_maker');
const assetId = parseInt(args.assetId);
const ladderTiers = parseInt(args.ladderTiers) || 3;
const environment = args.environment === 'mainnet' ? 'mainnet' : 'testnet';
const api = new AlgodexAPI({config: {
  'algod': {
    'uri': environment === 'mainnet' ? 'https://node.algoexplorerapi.io' :
      'https://node.testnet.algoexplorerapi.io',
    'token': '',
  },
  'indexer': {
    'uri': 'https://algoindexer.testnet.algoexplorerapi.io',
    'token': '',
  },
  'explorer': {
    'uri': environment === 'mainnet' ? 'https://indexer.testnet.algoexplorerapi.io' :
    'https://indexer.algoexplorerapi.io',
  },
  'dexd': {
    'uri': environment === 'mainnet' ? 'https://app.algodex.com/algodex-backend' :
      'https://testnet.algodex.com/algodex-backend',
    'token': '',
  },
}});

// id:
// 15322902
// isTraded:
// true
// price:
// 955
// price24Change:
// -3.0456852791878175
// priceBefore:
// 985
// unix_time:
// 1657622395

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const getLatestPrice = async (environment) => {
  const ordersURL = environment === 'testnet' ?
  'https://testnet.algodex.com/algodex-backend/assets.php' :
  'https://app.algodex.com/algodex-backend/assets.php';

  const assetData = await axios({
    method: 'get',
    url: ordersURL,
    responseType: 'json',
    timeout: 3000,
  });
  const assets = assetData.data.data;
  const latestPrice = assets.find(asset => asset.id === assetId).price;
  return latestPrice;
};

const initWallet = async algodexApi => {
  await algodexApi.setWallet({
    'type': 'sdk',
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'connector': require('../lib/wallet/connectors/AlgoSDK'),
    // eslint-disable-next-line max-len
    'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
  });
};

const getEscrowsToCancelAndMake = ({escrows, latestPrice, minSpreadPerc, nearestNeighborKeep,
  idealPrices}) => {
  const bidCancelPoint = latestPrice * (1 - minSpreadPerc);
  const askCancelPoint = latestPrice * (1 + minSpreadPerc);
  const escrowsTemp = escrows.map(escrow => {
    return {
      price: escrow.doc.order.price,
      type: escrow.doc.order.type,
      address: escrow.doc._id,
    };
  });
  const cancelEscrowAddrs = escrowsTemp.filter(escrow => {
    if (escrow.price > bidCancelPoint && escrow.type === 'buy') {
      return true;
    } else if (escrow.price < askCancelPoint && escrow.type === 'sell') {
      return true;
    }
    if (idealPrices.find(idealPrice => Math.abs(idealPrice - escrow.price) < nearestNeighborKeep)) {
      return false;
    }
    return true;
  }).map(escrow => escrow.address);
  const cancelAddrSet = new Set(cancelEscrowAddrs);
  const remainingEscrows = escrowsTemp.filter(escrow => !cancelAddrSet.has(escrow.address));

  const createEscrowPrices = idealPrices.filter(idealPrice => {
    if (remainingEscrows.find(escrow => Math.abs(escrow.price - idealPrice) < nearestNeighborKeep)) {
      return false;
    }
    return true;
  }).map(price => {
    return {
      price,
      'type': price < latestPrice ? 'buy' : 'sell',
    };
  });

  return {createEscrowPrices, cancelEscrowAddrs};
};

const getIdealPrices = (ladderTiers, latestPrice, minSpreadPerc) => {
  const prices = [];
  for (let i = 1; i <= ladderTiers; i++) {
    const sellPrice = latestPrice * ((1 + minSpreadPerc) ** i);
    const bidPrice = latestPrice * ((1 - minSpreadPerc) ** i);
    prices.push(sellPrice);
    prices.push(bidPrice);
  }
  prices.sort();
  return prices;
};

const convertToDBObject = dbOrder => {
  const obj = {
    address: dbOrder.address,
    version: dbOrder.version,
    price: dbOrder.price,
    amount: dbOrder.amount,
    total: dbOrder.price * dbOrder.amount,
    asset: {id: assetId, decimals: 6},
    assetId: dbOrder.assetId,
    type: dbOrder.type,
    appId: dbOrder.type === 'buy' ? 22045503 : 22045522,
    contract: {
      creator: dbOrder.contract.creator,
      data: dbOrder.contract.lsig.lsig.logic.toJSON(),
      escrow: dbOrder.contract.escrow,
    },
  };
  return obj;
};

const getCurrentOrders = async (escrowDB, indexer) => {
  const currentEscrows = await escrowDB.allDocs({include_docs: true});
  currentEscrows.rows.forEach(escrow => {
    escrow.doc.order.escrowAddr = escrow.doc._id;
  });
  const escrowsWithBalances = [];
  for (let i = 0; i < currentEscrows.rows.length; i++) {
    const escrow = currentEscrows.rows[i];
    const escrowAddr = escrow.doc.order.escrowAddr;
    try {
      const accountInfo =
        await indexer.lookupAccountByID(escrowAddr).do();
      // console.log('Information for Account: ' + JSON.stringify(accountInfo, undefined, 2));
      if (accountInfo?.account?.amount && accountInfo?.account?.amount > 0) {
        escrowsWithBalances.push(escrow);
      } else {
        console.log(`account ${escrowAddr} not found!`);
      }
    } catch (e) {
      console.log(`account ${escrowAddr} not found!`);
      console.error(e);
    }
  }
  const hasBalanceSet = new Set(escrowsWithBalances.map(escrow => escrow.doc.order.escrowAddr));
  const removeFromDBPromises = [];
  currentEscrows.rows.forEach(async escrow => {
    const addr = escrow.doc.order.escrowAddr;
    if (!hasBalanceSet.has(addr)) {
      removeFromDBPromises.push(escrowDB.remove(escrow.doc));
    }
  });
  await Promise.all(removeFromDBPromises).catch(function(e) {
    console.error(e);
  });
  return {rows: escrowsWithBalances};
};

const run = async ({escrowDB, assetId, ladderTiers, lastBlock} ) => {
  console.log('LOOPING...');
  if (!api.wallet) {
    await initWallet(api);
  }
  // const currentEscrows = await escrowDB.allDocs({include_docs: true});
  // currentEscrows.rows.forEach(escrow => {
  //   escrow.doc.order.escrowAddr = escrow.doc._id;
  // });

  const currentEscrows = await getCurrentOrders(escrowDB, api.indexer);
  let latestPrice;
  try {
    latestPrice = await getLatestPrice(environment);
  } catch (e) {
    console.error(e);
    await sleep(100);
    run({escrowDB, assetId, ladderTiers, lastBlock});
    return;
  }
  if (latestPrice === undefined) {
    await sleep(1000);
    run({escrowDB, assetId, ladderTiers, lastBlock});
    return;
  }

  const idealPrices = getIdealPrices(ladderTiers, latestPrice, minSpreadPerc);
  const {createEscrowPrices, cancelEscrowAddrs} = getEscrowsToCancelAndMake(
      {escrows: currentEscrows.rows,
        latestPrice, minSpreadPerc, nearestNeighborKeep, idealPrices});
  const cancelSet = new Set(cancelEscrowAddrs);
  const cancelPromises = currentEscrows.rows.map(order => order.doc.order)
      .filter(order => cancelSet.has(order.escrowAddr))
      .filter(order => order.contract.data !== undefined)
      .map(dbOrder => {
        const cancelOrderObj = {...dbOrder};
        cancelOrderObj.contract.lsig = new LogicSigAccount(dbOrder.contract.data.data);
        cancelOrderObj.client = api.algod;
        cancelOrderObj.wallet = api.wallet;
        const tempOrder = {...cancelOrderObj};
        delete tempOrder.wallet;
        delete tempOrder.contract;
        delete tempOrder.client;
        console.log('CANCELLING ORDER: ', JSON.stringify(tempOrder));
        return api.closeOrder(cancelOrderObj);
      });

  await Promise.all(cancelPromises).then(async function(results) {
    const addrs = results.map(result => result[0].escrowAddr);
    const resultAddrs = new Set(addrs);
    const removeFromDBPromises = currentEscrows.rows
        .filter(order => resultAddrs.has(order.doc.order.escrowAddr))
        .map(order => escrowDB.remove(order.doc));
    if (results.length > 0) {
      console.log({results});
    }
    await Promise.all(removeFromDBPromises).catch(function(e) {
      console.error(e);
    });
  }).catch(function(e) {
    console.error(e);
  });

  // const remainingEscrows = await escrowDB.allDocs({include_docs: true});
  const ordersToPlace = createEscrowPrices.map(priceObj => {
    const orderToPlace = {
      'asset': {
        'id': 15322902, // Asset Index
        'decimals': 6, // Asset Decimals
      },
      'address': api.wallet.address,
      'price': priceObj.price, // Price in ALGOs
      'amount': 0.001, // Amount to Buy or Sell
      'execution': 'maker', // Type of exeuction
      'type': priceObj.type, // Order Type
    };
    console.log('PLACING ORDER: ', JSON.stringify(orderToPlace));
    const orderPromise = api.placeOrder(orderToPlace);
    return orderPromise;
  });
  await Promise.all(ordersToPlace).then(async results => {
    const ordersAddToDB = results
        .filter(order => order[0].contract.amount > 0)
        .map(order => {
          return escrowDB.put({
            '_id': order[0].contract.escrow,
            'order': convertToDBObject(order[0]),
          });
        });
    await Promise.all(ordersAddToDB).catch(e => {
      console.error(e);
    });
  }).catch(e => {
    console.error(e);
  });

  await sleep(1000);
  run({escrowDB, assetId, ladderTiers, lastBlock: 0});
};

run({escrowDB, assetId, ladderTiers, lastBlock: 0});


