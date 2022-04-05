const algosdk = require('algosdk');
const compile = require('./compile/compile');
const newStructure = require('./newStructure');
const structure = require('./structure');
const structureRefreshed = require('./structureRefreshed');
const allOrderBookOrders = require('../../test/fixtures/allOrderBooks');
const { getAccountInfo } = require('../functions/base')

// const takerOrderBalance = {
// 	'asaBalance': orderAssetBalance,
// 	'algoBalance': orderAlgoBalance,
// 	'walletAlgoBalance': walletAlgoAmount,
// 	'walletASABalance': walletAssetAmount,
// 	'limitPrice': limitPrice,
// 	'takerAddr': userWalletAddr,
// 	'walletMinBalance': takerMinBalance,
// 	'takerIsOptedIn': takerIsOptedIn,
// };
it('test newStructure works with compile step', async () => {
	const input = require('../__tests__/Orders.json')[0];


	input.client = new algosdk.Algodv2(
		'11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
		'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080);
	const order = await compile(input);
	order.allOrderBookOrders = allOrderBookOrders;
	// order.wallets = {owner: await getAccountInfo(order.address)}
	// create function that adds wallets:{} right
	const result = await structureRefreshed(order)
	expect(result.contract.txns).toBeTruthy();
});
