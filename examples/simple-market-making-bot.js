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

const getEscrowsToCancelAndMake = ({escrows, lastPrice, minSpreadPerc, nearestNeighborKeep,
  idealPrices}) => {
  const bidCancelPoint = lastPrice * (1 - minSpreadPerc);
  const askCancelPoint = lastPrice * (1 + minSpreadPerc);
  const cancelEscrowAddrs = escrows.filter(escrow => {
    if (escrow.price > bidCancelPoint && escrow.type === 'buy') {
      return true;
    } else if (escrow.price < askCancelPoint && escrow.type === 'sell') {
      return true;
    }
    if (idealPrices.find(idealPrice => Math.abs(idealPrice - escrow.price) < nearestNeighborKeep)) {
      return true;
    }
    return false;
  }).map(escrow => escrow.contract.escrow);
  const cancelAddrSet = new Set(cancelEscrowAddrs);
  const remainingEscrows = escrows.filter(escrow => cancelAddrSet.has(escrow.contract.escrow));

  const createEscrowPrices = idealPrices.filter(idealPrice => {
    if (remainingEscrows.find(escrow => Math.abs(escrow.price - idealPrice) < nearestNeighborKeep)) {
      return false;
    }
    return true;
  }).map(price => {
    return {
      price,
      'type': price < lastPrice ? 'buy' : 'sell',
    };
  });

  return {createEscrowPrices, cancelEscrowAddrs};
};

const getIdealPrices = (ladderTiers, latestPrice, minSpreadPerc) => {
  const prices = [];
  for (let i = 1; i <= ladderTiers; i++) {
    const sellPrice = latestPrice * ((1 + minSpreadPerc) ** i);
    const bidPrice = latestPrice * ((1 - minSpreadPerc) ** i);
    prices.add(sellPrice);
    prices.add(bidPrice);
  }
  prices.sort();
};

const run = async ({escrowDB, currentEscrows, assetId, ladderTiers, lastBlock} ) => {
  if (!api.wallet) {
    await initWallet(api);
  }
  if (!currentEscrows) {
    currentEscrows = await escrowDB.allDocs({include_docs: true});
  }

  const latestPrice = await getLatestPrice(environment);
  if (latestPrice === undefined) {
    sleep(1000);
    run({escrowDB, currentEscrows, assetId, ladderTiers, lastBlock});
  }

  const idealPrices = getIdealPrices(ladderTiers, latestPrice, minSpreadPerc);
  const {createEscrowPrices, cancelEscrowAddrs} = getEscrowsToCancelAndMake({currentEscrows,
    latestPrice, minSpreadPerc, nearestNeighborKeep, idealPrices});
  const cancelSet = new Set(cancelEscrowAddrs);
  const cancelPromises = currentEscrows.rows.map(order => order.doc.order)
      .filter(order => cancelSet.has(order.contract.escrow))
      .map(dbOrder => {
        const cancelOrderObj = {
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
            lsig: new LogicSigAccount(dbOrder.contract.lsig.lsig.logic.data),
          },
          wallet: api.wallet,
          client: api.algod,
        };
        return api.closeOrder(cancelOrderObj);
      });
  const removeFromDBPromises = currentEscrows.rows.map(order => order.doc.order)
      .filter(order => cancelSet.has(order.contract.escrow))
      .map(order => escrowDB.remove(order));
  await Promise.all(removeFromDBPromises);
  await Promise.all(cancelPromises);

  // const remainingEscrows = await escrowDB.allDocs({include_docs: true});
  const ordersToPlace = createEscrowPrices.map(priceObj => {
    const orders = api.placeOrder({
      'asset': {
        'id': 15322902, // Asset Index
        'decimals': 6, // Asset Decimals
      },
      'address': api.wallet.address,
      'price': priceObj.price, // Price in ALGOs
      'amount': 0.001, // Amount to Buy or Sell
      'execution': 'maker', // Type of exeuction
      'type': priceObj.type, // Order Type
    });
    return orders[0];
  });
  const ordersAddToDB = ordersToPlace.map(order => {
    return escrowDB.put({
      '_id': order.contract.escrow,
      'order': order,
    });
  });
  await Promise.all(ordersAddToDB);

  // await escrowDB.put({
  //   '_id': orders[0].contract.escrow,
  //   'order': orders[0],
  // });
  // console.log({orders});
  // await sleep(2000);
  // run({wallet, escrowDB, currentEscrows, assetId, ladderTiers, lastBlock});
};

run({escrowDB, assetId, ladderTiers, lastBlock: 0});




// if (currentEscrows.rows.length > 0) {
//   const dbOrder = currentEscrows.rows[0].doc.order;
//   await escrowDB.remove(currentEscrows.rows[0].doc);
//   const appId = await api.getAppId(dbOrder);

//   const cancelOrderObj = {
//     address: dbOrder.address,
//     version: dbOrder.version,
//     price: dbOrder.price,
//     amount: dbOrder.amount,
//     total: dbOrder.price * dbOrder.amount,
//     asset: {id: assetId, decimals: 6},
//     assetId: dbOrder.assetId,
//     type: dbOrder.type,
//     appId: appId,
//     contract: {
//       creator: dbOrder.contract.creator,
//       lsig: new LogicSigAccount(dbOrder.contract.lsig.lsig.logic.data),
//     },
//     wallet: api.wallet,
//     client: api.algod,
//   };


//   // const order = {
//   //   'asset': dbOrder.asset,
//   //   'address': dbOrder.address,
//   //   'price': dbOrder.price,
//   //   'amount': dbOrder.amount,
//   //   'execution': 'close',
//   //   'type': dbOrder.type,
//   //   'contract': dbOrder.contract,
//   //   'appId': appId,
//   // };
//   // order.client = api.algod;

//   await api.closeOrder(cancelOrderObj);

