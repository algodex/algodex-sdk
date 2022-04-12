it('should construct a OrderType Error', ()=>{
  const OrderTypeExecption = require('./OrderTypeExecption');
  const err = new OrderTypeExecption('Error');
  expect(err).toBeInstanceOf(TypeError);
  expect(err).toBeInstanceOf(OrderTypeExecption);
});
