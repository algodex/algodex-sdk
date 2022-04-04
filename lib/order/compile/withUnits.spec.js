const withUnits = require('./withUnits.js');

it('should add algorand units', ()=>{
  const order = require('../../__tests__/Orders.json')[0];
  const res = withUnits(order);
  expect(res).toEqual({
    ...order,
    contract: {
      'price': 2.22,
      'amount': 1000000,
      'total': 2000000,
      'N': 100,
      'D': 222,
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
      'price': 1e-7,
      'amount': 1000000,
      'total': 2000000,
      'N': 10000000,
      'D': 1,
    },
  });
});
