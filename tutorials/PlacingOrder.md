# Placing your first Order 


### 🔨🔩🪓 &nbsp;&nbsp; There are multiple ways to place an order using our SDK. &nbsp;&nbsp; 🔧🪛⛏


🧰 &nbsp;&nbsp; You can think of [AlgodexApi.placeOrder](#placeOrder) as a toolbox:  it's got everything you need to tackle order execution &nbsp;&nbsp; 🧰 

✏️ &nbsp;&nbsp; We recommend reading the below before placing your first order




## 🪜 Steps 

&nbsp; &nbsp; ⚗️ &nbsp; &nbsp;   Configure an instance of the {@link AlgodexApi} 

&nbsp;&nbsp; 🔧 &nbsp; &nbsp;   Attach a {@link Wallet} compatible object to the ⚗️ 

&nbsp;&nbsp; 🏗 &nbsp; &nbsp;    Generate an {@link Order} compatible object

&nbsp;&nbsp; 💸 &nbsp; &nbsp;    Pass in the {@link Order} object to [AlgodexApi.placeOrder](#placeOrder)





### Execution types:  <center>🤜  &nbsp;&nbsp; {@tutorial Maker} &nbsp;&nbsp; 🤛  &nbsp;&nbsp; {@tutorial Taker} &nbsp;&nbsp; 🤝 &nbsp;&nbsp; {@tutorial Both}</center>




 &nbsp;&nbsp; 💡 &nbsp;&nbsp;  If you are unsure of which execution type to choose input `execution:'both'` and we'll handle the rest 😎 

&nbsp;&nbsp; 🎓 &nbsp;&nbsp; If you are curious about the internal processes of placing an order and how they relate to the different execution types, the [Structure Module]{@link module:order/structure} is a great place to start

👷‍♀️👷 &nbsp;&nbsp;Some people find it clunky to lug around a toolbox if they only need one or two tools

👷‍♀️👷 &nbsp;&nbsp;If that sounds like you, we recommend checking out [Buy]{@link module:txns/buy} & [Sell]{@link module:txns/sell} modules to get a better sense of what methods fit your use case




### Maker
``` javascript
//Buy Example:
const config = require('./config.json');
const AlgodexAPI = require('./lib/index');
const api = new AlgodexAPI(config);

api.setWallet({
  'type': 'sdk',ฺ
  'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  'connector': require('./lib/wallet/connectors/AlgoSDK'),
  'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
});

(async ()=>{
  const res = await api.placeOrder({
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'price': 3.22,
    'amount': 1,
    'execution': 'maker',
    'type': 'buy',
  });

  console.log(res)
  //OUTPUTS:
  {...order,
  contract: {
      ...order.contract,
      txns: [makePlaceAlgoTxns()]{@link module:txns/buy.makePlaceAlgoTxns}
    }
  }

})();
```

``` javascript 
// Sell Example:
(async ()=>{
  const res = await api.placeOrder({
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'price': 3.22,
    'amount': 1,
    'execution': 'maker',
    'type': 'sell',
  });

    console.log(res)
  //OUTPUTS:
    {...order,
    contract: {
        ...order.contract,
        txns: [makePlaceAssetTxns()]{@link module:txns/sell.makePlaceAssetTxns}
        }
    }
})();
```

### Taker

``` javascript
//Buy Example:
const config = require('./config.json');
const AlgodexAPI = require('./lib/index');
const api = new AlgodexAPI(config);

api.setWallet({
  'type': 'sdk',
  'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  'connector': require('./lib/wallet/connectors/AlgoSDK'),
  'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
});

(async ()=>{
  const res = await api.placeOrder({
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'price': 3.22,
    'amount': 1,
    'execution': 'taker',
    'type': 'buy',
  });

    console.log(res)
  //OUTPUTS:
    {...order,
    contract: {
        ...order.contract,
        txns: [makeExecuteAssetTxns()]{@link module:txns/sell.makeExecuteAssetTxns}
        }
    }



})();
```

``` javascript
// Sell Example:
const config = require('./config.json');
const AlgodexAPI = require('./lib/index');
const api = new AlgodexAPI(config);

api.setWallet({
  'type': 'sdk',
  'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  'connector': require('./lib/wallet/connectors/AlgoSDK'),
  'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
});

(async ()=>{
  const res = await api.placeOrder({
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'price': 3.22,
    'amount': 1,
    'execution': 'taker',
    'type': 'sell',
  });

    console.log(res)
  //OUTPUTS:
    {...order,
    contract: {
        ...order.contract,
        txns: [makeExecuteAlgoTxns()]{@link module:txns/buy.makeExecuteAlgoTxns}
        }
    }

})();
```



### Both

``` javascript
// Buy Example:
const config = require('./config.json');
const AlgodexAPI = require('./lib/index');
const api = new AlgodexAPI(config);

api.setWallet({
  'type': 'sdk',
  'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  'connector': require('./lib/wallet/connectors/AlgoSDK'),
  'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
});

(async ()=>{
  const res = await api.placeOrder({
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'price': 3.22,
    'amount': 1,
    'execution': 'both',
    'type': 'buy',
  });

    console.log(res)
  //OUTPUTS:
         [getMakerTakerTxns()]{@link module:order/structure.getMakerTakerTxns}

})();
```

``` javascript
// Sell Example:
const config = require('./config.json');
const AlgodexAPI = require('./lib/index');
const api = new AlgodexAPI(config);

api.setWallet({
  'type': 'sdk',
  'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  'connector': require('./lib/wallet/connectors/AlgoSDK'),
  'mnemonic': 'mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above',
});

(async ()=>{
  const res = await api.placeOrder({
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'price': 3.22,
    'amount': 1,
    'execution': 'both',
    'type': 'sell',
  });

     console.log(res)
  //OUTPUTS:
     [getMakerTakerTxns()]{@link module:order/structure.getMakerTakerTxns}

})();
```







