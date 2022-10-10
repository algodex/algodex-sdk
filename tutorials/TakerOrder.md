# What is a Taker order? [WIP]
### 📖 Definition
A Taker order is an order that executes instantly

A Taker order closes or modifies an existing order in the [Algodex Orderbook]{@tutorial Orderbook}

### 🤔 Condition 
There is at least one existing order in the orderbook that fulfills the user's criteria therefore they "take" from an existing order
### 🚶 Walkthrough
The user submitted order changes the state of the Orderbook in 1 of 3 ways:
   1. The User does not "take" the entire order so the order remains open with a modified amount
   2. The User takes the entire order removing it from the orderbook
   3. The User takes multiple orders, removing them from the orderbook

##### Related Concepts: [Maker]{@tutorial MakerOrder} || [Orderbook]{@tutorial Orderbook} || [Placing an Order]{@tutorial PlacingOrder}
