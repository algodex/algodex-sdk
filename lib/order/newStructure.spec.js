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
	const buyOrder = require('../__tests__/Orders.json')[0];
	const sellOrder = {...buyOrder, type:'sell'}



	buyOrder.client = new algosdk.Algodv2(
		'11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
		'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080);
	sellOrder.client = new algosdk.Algodv2(
		'11e4dcfb445a8c7e8380848747f18afcd5d84ccb395e003e5b72127ca5e9a259',
		'http://ec2-18-216-194-132.us-east-2.compute.amazonaws.com', 8080);
	const compiledBuyOrder = await compile(buyOrder);
	const compiledSellOrder = await compile(sellOrder)
	compiledBuyOrder.allOrderBookOrders = allOrderBookOrders;
	compiledSellOrder.allOrderBookOrders = allOrderBookOrders
	// order.wallets = {owner: await getAccountInfo(order.address)}
	// create function that adds wallets:{} right
	const buyResult = await structureRefreshed(compiledBuyOrder)


	expect(buyResult.contract.txns).toBeTruthy();
	const sellResult = await structureRefreshed(compiledSellOrder)
	
	expect(sellResult.contract.txns).toBeTruthy() //contract.txns is an empty array because the address in sellOrder has a 0 asa balance.


	// const sellResult = await 
});
