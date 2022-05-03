const toNumeratorDenominator = require('./toNumeratorDenominator');

it('should convert a price to N and D', ()=>{
  let nd = toNumeratorDenominator( 5.12345);
  expect(nd.D).toEqual(512345);
  expect(nd.N).toEqual(100000);

  nd = toNumeratorDenominator( 5);
  expect(nd.D).toEqual(5);
  expect(nd.N).toEqual(1);
});
