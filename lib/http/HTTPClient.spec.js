/* 
 * Copyright (C) 2021-2022 Algodex VASP (BVI) Corp.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// const axios = require('axios');
const HTTPClient = require('./HTTPClient');

const BASE_URL = 'https://code.jquery.com/jquery-3.6.0.slim.min.js';

// Mock outside of Integration Tests:
if (process.env.TEST_ENV !== 'integration') {
  jest.mock('axios');
}

let api; let etagApi;
describe('http/HTTPClient', ()=>{
  it('should construct and instance', ()=>{
    expect(()=>new HTTPClient()).toThrow('Must have a valid URL');
    expect(()=>new HTTPClient(BASE_URL, 'invalid')).toThrow('etags must be a boolean!');

    api = new HTTPClient(BASE_URL);
    etagApi = new HTTPClient(BASE_URL, true);
    expect(api).toBeInstanceOf(HTTPClient);
    expect(etagApi).toBeInstanceOf(HTTPClient);
  });

  describe.skip('HTTPClient.prototype', ()=>{
    it('should get a url', async ()=>{
      // Regular GET
      await expect(api.get())
          .rejects
          .toThrow('Must be a valid URL');
      await expect(api.get('urlString', false))
          .rejects
          .toThrow('Options must be an Object!');
      const res = await api.get(api.baseUrl);
      expect(Object.keys(res).length).toBeGreaterThan(0);


      // Test empty header and first etag request
      const first = await etagApi.get(etagApi.baseUrl);
      // Get a second request, should resolve to cache
      const cache = await etagApi.get(etagApi.baseUrl);
      // Pass in headers to another etag response
      await etagApi.get(etagApi.baseUrl, {headers: {}});

      // Expect ETAGS to work
      expect(Object.keys(first).length).toBeGreaterThan(0);
      expect(cache).toEqual(etagApi.cache.res[etagApi.baseUrl]);

      // TODO: Mock Axios Errors
      // axios.get.mockRejectedValueOnce(new Error('Something went wrong'));
    });
  });
});
