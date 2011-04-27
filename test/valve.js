/*
 *  Copyright 2011 Rackspace
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 */


var assert = require('./assert');
var validate = require('../lib//valve');
var V = require('../lib/valve').Valve;

exports['test_validate_int'] = function() {
  var rv;
  var schema = {
    a: new V().isInt()
  };

  // positive case
  var obj = { a: 1 };
  var obj_ext = { a: 1, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'integer test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'test' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'integer test (negative case)');
};

exports['test_validate_email'] = function() {
  var rv;
  var schema = {
    a: new V().isEmail()
  };

  // positive case
  var obj = { a: 'test@cloudkick.com' };
  var obj_ext = { a: 'test@cloudkick.com', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'email test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'invalidemail@' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'email test (negative case)');
};

exports['test_validate_url'] = function() {
  var rv;
  var schema = {
    a: new V().isUrl()
  };

  // positive case
  var obj = { a: 'http://www.cloudkick.com' };
  var obj_ext = { a: 'http://www.cloudkick.com', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'url test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'invalid/' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'url test (negative case)');
};

exports['test_validate_ip'] = function() {
  var rv;
  var schema = {
    a: new V().isIP()
  };

  // positive case
  var obj = { a: '192.168.0.1' };
  var obj_ext = { a: '192.168.0.1', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'IP test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'invalid/' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'IP test (negative case)');

  neg = {a: '12345' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'IP test (negative case 2)');

  // IPv6 normalization
  obj_ext = { a: '2001:db8::1:0:0:1'};
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'IPv6 test and normalization');
  assert.deepEqual(rv.cleaned.a, '2001:0db8:0000:0000:0001:0000:0000:0001');
};

exports['test_validate_cidr'] = function() {
  var rv;
  var schema = {
    a: new V().isCIDR()
  };

  // positive case
  var obj = { a: '192.168.0.1/2' };
  var obj_ext = { a: '192.168.0.1/2', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'CIDR test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'invalid/' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'CIDR test (negative case)');

  neg = { a: '192.168.0.1/128' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'CIDR test (negative case 2)');

  // IPv6 normalization
  obj_ext = { a: '2001:db8::1:0:0:1/3'};
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'IPv6 CIDR test');
  assert.deepEqual(rv.cleaned.a,
      '2001:0db8:0000:0000:0001:0000:0000:0001/3');

  neg = { a: '2001:db8::1:0:0:1/194' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'IPv6 CIDR test (negative case)');

};

exports['test_validate_alpha'] = function() {
  var rv;
  var schema = {
    a: new V().isAlpha()
  };

  // positive case
  var obj = { a: 'ABC' };
  var obj_ext = { a: 'ABC', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'alpha test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'invalid/' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'alpha test (negative case)');
};

exports['test_validate_alphanumeric'] = function() {
  var rv;
  var schema = {
    a: new V().isAlphanumeric()
  };

  // positive case
  var obj = { a: 'ABC123' };
  var obj_ext = { a: 'ABC123', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'alphanumeric test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'invalid/' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'alphanumeric test (negative case)');
};

exports['test_validate_numeric'] = function() {
  var rv;
  var schema = {
    a: new V().isNumeric()
  };

  // positive case
  var obj = { a: '123' };
  var obj_ext = { a: 123, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'numeric test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: '/' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'numeric test (negative case)');
};

exports['test_validate_lowercase'] = function() {
  var rv;
  var schema = {
    a: new V().isLowercase()
  };

  // positive case
  var obj = { a: 'abc' };
  var obj_ext = { a: 'abc', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'lowercase test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'ABCabc' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'lowercase test (negative case)');
};

exports['test_validate_uppercase'] = function() {
  var rv;
  var schema = {
    a: new V().isUppercase()
  };

  // positive case
  var obj = { a: 'ABC' };
  var obj_ext = { a: 'ABC', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'uppercase test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'ABCabc' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'uppercase test (negative case)');
};

exports['test_validate_decimal'] = function() {
  var rv;
  var schema = {
    a: new V().isDecimal()
  };

  // positive case
  var obj = { a: '123.123' };
  var obj_ext = { a: 123.123, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'decimal test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'ABCabc' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'decimal test (negative case)');
};

exports['test_validate_float'] = function() {
  var rv;
  var schema = {
    a: new V().isFloat()
  };

  // positive case
  var obj = { a: 123.123 };
  var obj_ext = { a: 123.123, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'float test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'ABCabc' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'float test (negative case)');
};

exports['test_validate_notnull'] = function() {
  var rv;
  var schema = {
    a: new V().notNull()
  };

  // positive case
  var obj = { a: '1' };
  var obj_ext = { a: '1', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'notnull test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: '' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'notnull test (negative case)');
};

exports['test_validate_notempty'] = function() {
  var rv;
  var schema = {
    a: new V().notEmpty()
  };

  // positive case
  var obj = { a: '1' };
  var obj_ext = { a: '1', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'notempty test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: '' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'notempty test (negative case)');
};

exports['test_validate_regex'] = function() {
  var rv;
  var schema = {
    a: new V().regex('^a$')
  };

  // positive case
  var obj = { a: 'a' };
  var obj_ext = { a: 'a', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'regex test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'b' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'regex test (negative case)');
};

exports['test_validate_notregex'] = function() {
  var rv;
  var schema = {
    a: new V().notRegex(/e/)
  };

  // positive case
  var obj = { a: 'foobar' };
  var obj_ext = { a: 'foobar', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'notregex test');
  assert.deepEqual(rv.cleaned, obj);
};

exports['test_validate_len'] = function() {
  var rv;
  var schema = {
    a: new V().len(1)
  };

  // positive case
  var obj = { a: '1' };
  var obj_ext = { a: '1', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'len test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: '' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'len test (negative case)');
};

exports['test_validate_null'] = function() {
  var rv;
  var schema = {
    a: new V().isNull()
  };

  // positive case
  var obj = { a: null};
  var obj_ext = { a: null, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'null test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'not null' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'null test (negative case)');
};

exports['test_validate_equals'] = function() {
  var rv;
  var schema = {
    a: new V().equals(123)
  };

  // positive case
  var obj = { a: 123};
  var obj_ext = { a: 123, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'equals test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'not 123' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'equals test (negative case)');
};

exports['test_validate_present'] = function() {
  var rv;
  var schema = {
    a: new V().notEmpty()
  };

  // positive case
  var obj = { a: 123};
  var obj_ext = { a: 123, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'validate present');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { b: 2 };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'validate (negative case)');
};

exports['test_validate_contains'] = function() {
  var rv;
  var schema = {
    a: new V().contains('abc')
  };

  // positive case
  var obj = { a: 'abc'};
  var obj_ext = { a: 'abc', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'contains test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: '123' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'contains test (negative case)');
};

exports['test_validate_not_contains'] = function() {
  var rv;
  var schema = {
    a: new V().notContains('abc')
  };

  // positive case
  var obj = { a: '123'};
  var obj_ext = { a: '123', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'not contains test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var neg = { a: 'abc' };
  rv = validate.check(schema, neg);
  assert.ok(rv.is_valid === false, 'not contains test (negative case)');
};

exports['test_validate_chain'] = function() {
  var rv;
  var schema = {
    a: new V().len(1).isNumeric()
  };

  // positive case
  var obj = { a: '1' };
  var obj_ext = { a: '1', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'chain test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  rv = validate.check(schema, { a: '' });
  assert.ok(rv.is_valid === false, 'chain test (negative case)');

  // negative case
  rv = validate.check(schema, { a: 'A' });
  assert.ok(rv.is_valid === false, 'chain test (negative case)');
};

exports['test_validate_nested'] = function() {
  var rv;
  var schema = {
    a: new V().array(new V().isInt().toInt())
  };

  // positive case
  var obj = { a: [1] };
  var obj_ext = { a: ['1'], b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'nested test');
  assert.deepEqual(rv.cleaned, obj);
};


exports['test_validate_tofloat'] = function() {
  var rv;
  var schema = {
    a: new V().array(new V().toFloat())
  };

  // positive case
  var obj = { a: [3.145] };
  var obj_ext = { a: ['3.145'], b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'tofloat test');
  assert.ok(typeof rv.cleaned.a[0] === 'number', 'tofloat === number test');
  assert.deepEqual(rv.cleaned, obj);
};


exports['test_validate_string'] = function() {
  var rv;
  var schema = {
    a: new V().string()
  };

  // positive case
  var obj = { a: 'test' };
  var obj_ext = { a: 'test', b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'string test');
  assert.deepEqual(rv.cleaned, obj);

  // negative case
  var obj = { a: 123 };
  var obj_ext = { a: 123, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === false, 'string test (negative case)');
};


exports['test_validate_nested_array'] = function() {
  var rv;
  var schema = {
    a: new V().array(new V().string())
  };

  // positive case
  var obj = { a: ['test'] };
  var obj_ext = { a: ['test'], b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'string test');
  assert.deepEqual(rv.cleaned, obj);
};

exports['test_validate_nested_hash'] = function() {
  var rv;
  var schema = {
    a: new V().hash(new V().string(), new V().string())
  };

  // positive case
  var obj = { a: {'test' : 'test'} };
  var obj_ext = { a: {'test' : 'test'}, b: 2 };
  rv = validate.check(schema, obj_ext);
  assert.ok(rv.is_valid === true, 'hash test');
  assert.deepEqual(rv.cleaned, obj);
};
