const http = require('./index');

it('should export the http module', ()=>{
  expect(http.AlgodexClient).toBeInstanceOf(Function);
  expect(http.ExplorerClient).toBeInstanceOf(Function);
  expect(http.IndexerClient).toBeInstanceOf(Function);
  expect(http.HTTPClient).toBeInstanceOf(Function);
});
