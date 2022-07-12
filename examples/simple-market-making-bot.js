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

const escrowDB = new PouchDB('escrows');
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

const run = async ({escrowDB, currentEscrows, assetId, ladderTiers, lastBlock} ) => {
  if (!api.wallet) {
    await api.setWallet({
      'type': 'sdk',
      'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      'connector': require('../lib/wallet/connectors/AlgoSDK'),
      // eslint-disable-next-line max-len
      'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
    });
  }
  if (!currentEscrows) {
    currentEscrows = await escrowDB.allDocs({include_docs: true});
  }
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
  if (latestPrice === undefined) {
    sleep(1000);
    run({escrowDB, currentEscrows, assetId, ladderTiers, lastBlock});
  }

  if (currentEscrows.rows.length > 0) {
    const dbOrder = currentEscrows.rows[0].doc.order;
    await escrowDB.remove(currentEscrows.rows[0].doc);
    const appId = await api.getAppId(dbOrder);

    const cancelOrderObj = {
      address: dbOrder.address,
      version: dbOrder.version,
      price: dbOrder.price,
      amount: dbOrder.amount,
      total: dbOrder.price * dbOrder.amount,
      asset: {id: assetId, decimals: 6},
      assetId: dbOrder.assetId,
      type: dbOrder.type,
      appId: appId,
      contract: {
        creator: dbOrder.contract.creator,
        lsig: new LogicSigAccount(dbOrder.contract.lsig.lsig.logic.data),
      },
      wallet: api.wallet,
      client: api.algod,
    };


    // const order = {
    //   'asset': dbOrder.asset,
    //   'address': dbOrder.address,
    //   'price': dbOrder.price,
    //   'amount': dbOrder.amount,
    //   'execution': 'close',
    //   'type': dbOrder.type,
    //   'contract': dbOrder.contract,
    //   'appId': appId,
    // };
    // order.client = api.algod;

    await api.closeOrder(cancelOrderObj);
  } else {
    const orders = await api.placeOrder({
      'asset': {
        'id': 15322902, // Asset Index
        'decimals': 6, // Asset Decimals
      },
      'address': api.wallet.address,
      'price': latestPrice, // Price in ALGOs
      'amount': 0.001, // Amount to Buy or Sell
      'execution': 'maker', // Type of exeuction
      'type': 'buy', // Order Type
    });
    console.log('placed order! ');
    await escrowDB.put({
      '_id': orders[0].contract.escrow,
      'order': orders[0],
    });
    // await api.closeOrder(orders[0]);
  }
  // console.log({orders});
  // await sleep(2000);
  // run({wallet, escrowDB, currentEscrows, assetId, ladderTiers, lastBlock});
};

run({escrowDB, assetId, ladderTiers, lastBlock: 0});
