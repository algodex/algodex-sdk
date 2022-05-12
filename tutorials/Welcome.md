# Welcome to the Algodex SDK!


```jsx
import AlgodexAPI from '@algodex/algodex-sdk'
// Create an instance of the API
const api = new AlgodexAPI({
  // Configure Services
  "config": {
    "algod": {
      "uri": "http://algorand-node",
      "token": "",
      "port": 8080
    },
    "indexer": {
      "uri": "http://algorandindexer",
      "token": ""
    },
    "dexd": {
      "uri": "https://api-testnet-public.algodex.com/algodex-backend",
      "token": ""
    }
  },
  // Default Asset 
  "asset": {
    "id": 21582668,
    "decimals": 6
  },
  // Default Wallet
  "wallet": {
    "type": "sdk",
    "address": "WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI",
    "connector": {
      "connected": false
    },
    "mnemonic": "mass army warrior number blush distance enroll vivid horse become spend asthma hat desert amazing room asset ivory lucky ridge now deputy erase absorb above"
  }
})

// Compile, Structure, Sign and Propagate Transactions for Order
await api.placeOrder({
  // You can override the default or set the asset while placing the order
  'asset': { 
    "id": 21582668,
    "decimals": 6
  },
  'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
  'price': 10,
  'amount': 1,
  'total': 10,
  'execution': 'maker',
  'type': 'buy',
  'appId': api.getAppId('buy'),
  'version': 6,
})
```
