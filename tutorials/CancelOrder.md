
# <a name="close"></a> ❌ Close order

Close an order from the {@tutorial Orderbook}. Must be connected to the wallet
that created the order.

### Buy Order
```javascript
const orders = api.
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
```
### Sell Order
```javascript
  const res = await api.placeOrder({
    'asset': {
      'id': 15322902,
      'decimals': 6,
    },
    'address': 'WYWRYK42XADLY3O62N52BOLT27DMPRA3WNBT2OBRT65N6OEZQWD4OSH6PI',
    'price': 80000,
    'amount': 1,
    'execution': 'both',
    'type': 'sell',
  });
```
