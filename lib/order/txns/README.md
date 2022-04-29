# ℹ Order Transactions

Importing from sdk api statics

```jsx
import AlgodexApi from '@algodex/algodex-sdk'
AlgodexApi.txns.makePlaceAlgoTxns
```


Importing destructured
```jsx
import {txns} from '@algodex/algodex-sdk'
txns.makePlaceAlgoTxns
```

Import directly

```jsx
import {makePlaceAlgoTxns} from '@algodex/algodex-sdk/lib/txns';
// or preferably
import makePlaceAlgoTxns from '@algodex/algodex-sdk/lib/txns/makePlaceAlgoTxns';
```


Interacting with the smart contracts happens in the delegate templates
located in ../teal/templates. 

There are two types of delegate contracts, Buy(Algo) and Sell(ASA).

There are three types of execution for each contract, Maker(Place) | Taker(Execute) | Both

| Type     | Execution | Path                  | Description                         | 
|----------|-----------|-----------------------|-------------------------------------|
| Buy      | Maker     | ./makePlaceAlgoTxns   | Place Algos into the Buy Orderbook  |
| Sell     | Maker     | ./makePlaceAsaTxns    | Place Asset into the Sell Orderbook |
| Buy      | Taker     | ./makeExecuteAlgoTxns | Execute against Algo Orders         | 
| Sell     | Taker     | ./makeExecuteAsaTxns  | Execute against Asset Orders        |
| Buy/Sell | Both      | ./makeTxns            | Computed Maker/Taker orders         |
