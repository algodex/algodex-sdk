The original method of executeOrder is now ./execute.

PARAMS:

algodClient: client
isSellingASA: type === sell
assetId: asset.id
userWalletAddr: address
limitPrice: price
orderAssetAmount: amount
orderAlgoAmount: amount
allOrderBookOrders: orderbook
includeMaker: execution === maker
walletConnector,


CALL STACK:

- Get Orders
- Get Account Info
- Get Min Balance
- Wallet Algo Amount
- isOptIn
- OrderAssetAmount
- OrderAlgoAmount

if (isSellingASA) {
// we are selling an ASA so check wallet balance
orderAlgoBalance = walletAlgoAmount;
orderAssetBalance = Math.min(orderAssetAmount, walletAssetAmount);
} else {
// wallet ASA balance doesn't matter since we are selling algos
orderAlgoBalance = Math.min(orderAlgoAmount, walletAlgoAmount);
orderAssetBalance = walletAssetAmount;
} 

const takerOrderBalance = {
'asaBalance': orderAssetBalance,
'algoBalance': orderAlgoBalance,
'walletAlgoBalance': walletAlgoAmount,
'walletASABalance': walletAssetAmount,
'limitPrice': limitPrice,
'takerAddr': userWalletAddr,
'walletMinBalance': takerMinBalance,
'takerIsOptedIn': takerIsOptedIn,
};


// Invalid order
if (queuedOrders == null && !includeMaker) {
console.debug('null queued orders, returning early');
return;
}

Structure: Start of mapping of Txns, creating ExecuteOrderTxns
https://github.com/algodex/algodex-sdk/blob/next/lib/functions/base.js#L693
https://github.com/algodex/algodex-sdk/blob/7f4d9a834f4bd7e7f57b97422d0da34ef0b42c3f/lib/functions/base.js#L2129

Structure: PlaceOrderTxns https://github.com/algodex/algodex-sdk/blob/next/lib/functions/base.js#L830

Propigate: https://github.com/algodex/algodex-sdk/blob/next/lib/functions/base.js#L929
