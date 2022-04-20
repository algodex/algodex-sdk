PLACE ORDER


if (order.execution === 'maker')

- if (order.type === 'buy') 
  - placeAlgosToBuyASAOrderIntoOrderbook
    - [getPlaceAlgosToBuyASAOrderIntoOrderbook](https://github.com/algodex/algodex-sdk/blob/c31fd98f761d8a23c80be33e65e952174152af6e/algodex_api.js#L920)
                
- if (order.type === 'sell')
  - placeASAToSellASAOrderIntoOrderbook
    - [getPlaceASAToSellASAOrderIntoOrderbook](https://github.com/algodex/algodex-sdk/blob/c31fd98f761d8a23c80be33e65e952174152af6e/algodex_api.js#L1063)


if (order.execution === 'taker')
- executeOrderAsTaker
  - [executeOrder](https://github.com/algodex/algodex-sdk/blob/c31fd98f761d8a23c80be33e65e952174152af6e/algodex_api.js#L290)

if (order.execution === 'market')
- executeMarketOrderAsTaker
  - executeMarketOrder
    - [executeOrder](https://github.com/algodex/algodex-sdk/blob/c31fd98f761d8a23c80be33e65e952174152af6e/algodex_api.js#L290)

default case:
- executeOrderAsMakerAndTaker
  - [executeOrder](https://github.com/algodex/algodex-sdk/blob/c31fd98f761d8a23c80be33e65e952174152af6e/algodex_api.js#L290)
