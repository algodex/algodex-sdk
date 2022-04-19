const algosdk = require('algosdk');
const structureRefreshed = require('./structureRefreshed');
const algodexApi = require('../AlgodexApi');
const compile = require('./compile/compile')


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
    'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
  },
};

const api = new algodexApi(apiProps);
const client = new algosdk.Algodv2(
    '11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
    'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080);

it('Should have a valid wallet secret key if type is sdk and mnemonic is provided', () => {
  expect(api.wallet.sk).toBeTruthy();
  expect(typeof api.wallet.sign).toBe('function');
});

it('test newStructure works with compile step', async () => {
  const buyOrder = require('../__tests__/Orders.json')[1];
  const sellOrder = require('../__tests__/Orders.json')[0];
  buyOrder.client = client;
  sellOrder.client = client;

	const groupBy = (items, key) => items.reduce(
		(result, item) => ({
			...result,
			[item[key]]: [
				...(result[item[key]] || []),
				item.signedTxn.blob,
			],
		}),
		{},
);

	const res = await api.http.dexd.fetchAssetOrders(buyOrder.asset.id);

	const orderbook = api.http.dexd.mapToAllEscrowOrders({
		buy: res.buyASAOrdersInEscrow,
		sell: res.sellASAOrdersInEscrow,
	});

	buyOrder.asset.orderbook=orderbook
  const compiledBuyOrder = await compile(buyOrder);
  // const newBuyorder = await api.placeOrder(
  //     buyOrder, {wallet: {
  //       type: 'sdk',
  //       connector: {
  //         connected: true,
  //       },
  //       address: 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  //     }});

	

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


  const buyResult = await structureRefreshed(compiledBuyOrder);
  expect(buyResult.contract.txns).toBeTruthy();

		const signedTxns = api.wallet.sign(buyResult.contract.txns);

		const rawTxnsForSending = signedTxns.map((txn) => txn.signedTxn.blob);

		// const txn = await algosdk.sendRawTransaction(signedTxns).do();

	const signedGroups = groupBy(signedTxns, 'groupNum')
	for(let group in signedGroups) {
		const {txId} = await client.sendRawTransaction(signedGroups[group]).do();
		const result = await algosdk.waitForConfirmation(client, txId, 10);

	}






	
		// expect(result).toBeTruthy();

  expect(api.wallet.sign(buyResult.contract.txns)).not.toBeTruthy();
}, 1000000);
