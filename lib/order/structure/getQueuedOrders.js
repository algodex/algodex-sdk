

function getQueuedOrders(order) {
  return order.asset.orderbook.filter(
      (o) => o.escrowOrderType !== order.type, // TODO: Check with Michael to see if we should explicitly check for 'buy' or 'sell'
  ).sort(order.type === 'sell' ?
        (a, b) => (a.price < b.price) ? 1 : (a.price === b.price) ? ((a.price < b.price) ? 1 : -1) : -1 :
        (a, b) => (a.price > b.price) ? 1 : (a.price === b.price) ? ((a.price > b.price) ? 1 : -1) : -1,
  );
}

module.exports = getQueuedOrders;
