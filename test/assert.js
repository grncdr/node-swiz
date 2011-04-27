/**
 * Custom assert methods.
 */

var assert = require('assert');

var keys = Object.keys(assert);
keys.forEach(function(key) {
  exports[key] = assert[key];
});
