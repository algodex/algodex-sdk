# What is a Maker Order? [WIP]

### 📖 Definition
A Maker order is an order that **does not** execute instantly

A Maker order has no active [Takers]{@tutorial TakerOrder}, therefore it "makes" its own order to be fulfilled at a later date

### 🤔 Condition
When a user places an order, if no one immediately agrees to the terms of the order, the order is considered a Maker order

### 🚶 Walkthrough
1. There are no existing orders in the [Algodex Orderbook]{@tutorial Orderbook} that fulfill the user's criteria so they decide to "make" their own order
2. The user submitted order is added to the [Algodex Orderbook]{@tutorial Orderbook}
3. The order is now visible to other users of Algodex and fulfills when another user agrees to "take" the order

 
##### Related Concepts: [Taker]{@tutorial TakerOrder} || [Orderbook]{@tutorial Orderbook} || [Placing an Order]{@tutorial PlacingOrder}










