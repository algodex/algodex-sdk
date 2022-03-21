const HTTPClient = require('../HTTPClient');
const httpDataMock = require('../../../spec/http');

Object.assign(HTTPClient.prototype, {
  async get(url) {
    return {data: httpDataMock[url]};
  },
});
module.exports = HTTPClient;
