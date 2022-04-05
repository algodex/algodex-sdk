const withOrderbookEntry = require('./withOrderbookEntry');
const withUnits = require('./withUnits');
const orders = require('../../__tests__/Orders.json');

it('should throw error when missing parameters', ()=>{
  const order = orders[0];
  // Invalid missing N/D
  expect(()=>withOrderbookEntry(order)).toThrowError(TypeError);
  // Missing D
  expect(()=>withOrderbookEntry({
    ...order,
    contract: {
      ...order.contract,
      N: 1,
    },
  })).toThrowError(TypeError);
});

it('should create an orderbook entry', ()=>{
  orders.map((order)=>{
    const o = withOrderbookEntry(withUnits(order));
    const {contract: {N, D}, asset: {id}, address, min=0} = o;
    const check = order.execution === 'maker' ?
      `${address}-${N}-${D}-${min}-${id}` :
      `${N}-${D}-${min}-${id}`;
    expect(o.contract.entry).toEqual(check);
  });
});
