const baseConfig = require('../playwright.config.js');
module.exports = {
  ...baseConfig,
  testDir: '.',
};
