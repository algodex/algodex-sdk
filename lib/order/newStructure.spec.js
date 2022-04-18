const algosdk = require('algosdk');
const structureRefreshed = require('./structureRefreshed');
const AlgodexApi = require('../AlgodexApi');


/**
   *
   * @type {spec.APIProperties}
   */
const apiProps = {
  'config': {
    'algod': {
      'uri': 'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com',
      'token': '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
      'port': 8080,
    },
    'indexer': {
      'uri': 'https://algoindexer.testnet.algoexplorerapi.io',
      'token': '',
    },
    'dexd': {
      'uri': 'https://api-testnet-public.algodex.com/algodex-backend',
      'token': '',
    },
  },
  'wallet': {
    'type': 'sdk',
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'connector': require('../wallet/connectors/AlgoSDK'),
    'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
  },
};
const api = new AlgodexApi(apiProps);

it('Should have a valid wallet secret key if type is sdk and mnemonic is provided', () => {
  expect(api.wallet.connector.sk).toBeTruthy();
  expect(typeof api.wallet.connector.sign).toBe('function');
});

it.skip('test newStructure works with compile step', async () => {
  const buyOrder = require('../__tests__/Orders.json')[1];
  const sellOrder = require('../__tests__/Orders.json')[0];
  buyOrder.client = api.client;
  sellOrder.client = api.client;
  // const compiledBuyOrder = await compile(buyOrder);
  const newBuyorder = await api.placeOrder(
      buyOrder, {wallet: {
        type: 'sdk',
        connector: {
          connected: true,
        },
        address: 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
      }});

  // const newSellOrder = await api.placeOrder(
  //     sellOrder, {wallet: {
  //       connector: {
  //         connected: true,
  //       },
  //       address: 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  //     }},
  // );

  // const sellResult = await structureRefreshed(newSellOrder);
  // expect(sellResult.contract.txns).toBeTruthy();


  const buyResult = await structureRefreshed(newBuyorder);
  expect(buyResult.contract.txns).toBeTruthy();

  const signedTxns = api.wallet.connector.sign(buyResult.contract.txns);

  const rawTxnsForSending = signedTxns.map((txn) => txn.signedTxn.blob);

  // const txn = await algosdk.sendRawTransaction(signedTxns).do();
  const {txId} = await api.client.sendRawTransaction(rawTxnsForSending).do();
  const result = await algosdk.waitForConfirmation(api.client, txId, 10);
  expect(result).toBeTruthy();

  // expect(api.wallet.sign(buyResult.contract.txns)).not.toBeTruthy();
}, 600000);
