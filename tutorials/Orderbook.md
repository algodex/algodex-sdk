# What is an Orderbook? [WIP]

<p align="center">
<img src="../assets/images/Orderbook.png" height="400" width="300"/>
</p>

### 📖 Definition
An orderbook is a collection of Buy and Sell orders that were originally placed using a [Maker]{@tutorial MakerOrder} execution type

### 🤔 Condition
If Algodex supports an asset then a unique orderbook exists for that asset 

### 🚶 Walkthrough
1. A user is interested in the price of a particular asset so they fetch the Algodex orderbook related to that asset
2. The Algodex orderbook contains the most recent unfulfilled Buy and Sell order's related to that asset
3. An order remains in the orderbook until someone places an order using a [Taker]{@tutorial TakerOrder} execution type




