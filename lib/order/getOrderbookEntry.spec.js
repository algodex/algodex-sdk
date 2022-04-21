const orders = require('../__tests__/Orders.json');
const withUnits = require('./compile/withUnits');
const getOrderbookEntry = require('./getOrderbookEntry');

it('should create an orderbook entry', ()=>{
  orders.map((order)=>{
    const o = withUnits(order);

    const {contract: {N, D}, asset: {id}, address, min=0} = o;
    const check = order.execution === 'maker' ?
      `${address}-${N}-${D}-${min}-${id}` :
      `${N}-${D}-${min}-${id}`;
    expect( getOrderbookEntry(o)).toEqual(check);
  });
});
