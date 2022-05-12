const withUnits = require('./withUnits.js');

it('should add algorand units', ()=>{
  const order = require('../../__tests__/Orders.json')[0];
  const res = withUnits(order);
  expect(res).toEqual({
    ...order,
    contract: {
      'D': 235,
      'N': 1,
      'amount': 100000,
      'total': 23500000,
    },
  });
});

it('should add algorand units with scientific notation', ()=>{
  const order = require('../../__tests__/Orders.json')[0];
  order.price = 1e-7;
  const res = withUnits(order);
  expect(res).toEqual({
    ...order,
    contract: {
      'D': 1,
      'N': 10000000,
      'amount': 100000,
      'total': 23500000,
    },
  });
});
