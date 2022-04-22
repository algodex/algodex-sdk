const TestConfig = require('./TestConfig');
let config;

/**
 * Construct a Test Configuration
 * @return {TestConfig}
 */
function makeTestConfig() {
  if (typeof config === 'undefined') {
    config = new TestConfig();
  }
  return config;
}

module.exports = makeTestConfig();
