const withUnits = require('./withUnits.js');

it('should compile delegate template', ()=>{
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
