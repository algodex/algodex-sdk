# ℹ Overview

HTTP module based on [Axios](https://axios-http.com/docs/intro). This may change to [cross-fetch](https://github.com/lquixada/cross-fetch) 
in the future. HTTPClient interface will remain the same regardless of `fetch` package. Currently, there are only two
supported REST services.

### 📁 Folder Structure

```shell
# tree -f -L 2
.
├── ./clients # REST Clients
│   ├── ./AlgodexClient # Algodex REST API
│   └── ./ExplorerClient # AlgoExplorer REST API
├── ./HTTPClient.js # Base Axios Client
└── ./README.md
```

### ⚙ HTTPClient

`HTTPClient` is an Axios instance with a `GET` method that includes `etags` and response caching. Enable etag caching
by setting etags=true. `AlgodexClient` and `ExplorerClient` are extended from `HTTPClient`.

```javascript
// Require the base client
const HTTPClient = require('../HTTPClient');
// Declare any defaults
const BASE_URL = 'https://httpbin.org/get';


/**
 * Pure static function that maps a Response of CustomClient
 * 
 * @param {object} res Response Object
 * @param {string} res.status A status
 * @param {...*} rest The rest of the response object
 * @returns {object}
 */
function mapResponse({status, ...rest}){
  return Object.create({status: `mapped-${status}`, ...rest})
}


/**
 * A new HTTP Client
 * 
 * @param {string} baseUrl Base URL to use for API requests
 * @param {boolean} etags Flag to enable etag support
 * @constructor
 */
function CustomClient(baseUrl=BASE_URL, etags=false) {
  // Apply client
  const client = new HTTPClient(baseUrl, etags);
  Object.keys(client).forEach((key)=>{
    this[key] = client[key];
  });
}

// Statics
CustomClient.mapResponse = mapResponse;

// Extend from HTTPClient
CustomClient.prototype = Object.create(HTTPClient.prototype);
// Override/Assign prototypes
Object.assign(ExplorerClient.prototype, {
  /**
   * Make a get request
   *
   * @return {Promise<*>}
   */
  async fetchHTTPBinGet() {
    return await this.get(`${this.baseUrl}`);
  },
});

module.exports = CustomClient;

```
