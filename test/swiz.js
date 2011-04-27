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
var swiz = require('../lib/serializer');


// Mock set of serialization defs
var def = {'Node' : [
  ['id' , {'src' : 'hash_id', 'type' : 'string',
    'desc' : 'hash ID for the node'}],
  ['is_active' , {'src' : 'active', 'type' : 'bool',
    'desc' : 'is the node active?'}],
  ['name' , {'src' : 'get_name', 'type' : 'string', 'desc' : 'name' }],
  ['agent_name' , {'type': 'string'}],
  ['ipaddress' , {'src' : 'get_public_address', 'type' : 'ip'}],
  ['public_ips' , {'cache_key' : 'node_addrs_public', 'type' : 'list<ip>'}]
]
};



/** Completely mock node object.
* @constructor
*/
function Node() {
  this.hash_id = '15245';
  this.active = true;
  this.agent_name = 'gl<ah';
  this.public_ips = ['123.45.55.44', '122.123.32.2'];
}


/**
 * Dummy funct
 * @param {function(*,*)} callback junk.
 */
Node.prototype.get_name = function(callback) {
  callback(null, 'gggggg');
};


/**
 * Dummy funct
 * @param {function(*,*)} callback junk.
*/
Node.prototype.get_public_address = function(callback) {
  callback(null, '123.33.22.1');
};


/**
 * Dummy funct
 * @return {string} junk.
*/
Node.prototype.getSerializerType = function() {return 'Node';};

exports['test_xml_escape_string'] = function() {
  sw = new swiz.Swiz(def);
  assert.deepEqual(sw.xmlEscapeString('<&blah>'), '&lt;&amp;blah&gt;');
};

exports['test_xml_elem'] = function() {
  sw = new swiz.Swiz(def);
  assert.deepEqual('<blah>stuff</blah>', sw.xmlElem('blah', 'stuff'));
};

exports['test_xml_array_serial'] = function() {
  sw = new swiz.Swiz(def);
  // test null array handling
  var str = sw.serializeArrayXml('blah', []);
  var eq1 = '<blah/>' === str;
  var eq2 = '<blah></blah>' === str;
  assert.deepEqual(true, eq1 || eq2);
  // test array-of-ints handling
  assert.deepEqual('<blah>1</blah><blah>2</blah>',
      sw.serializeArrayXml('blah', [1, 2]));
  // test array-of-strings handling
  assert.deepEqual('<blah>1</blah><blah>bla</blah>',
      sw.serializeArrayXml('blah', [1, 'bla']));
  // text mixed-array handling
  assert.deepEqual('<blah>1</blah><blah>bla</blah><blah>2</blah>',
      sw.serializeArrayXml('blah', [1, 'bla', '2']));
};

exports['test_xml_array_hash'] = function() {
  sw = new swiz.Swiz(def);
  // test null hash handling
  var str = sw.serializeHashXml('blah', {});
  var eq1 = '<blah/>' === str;
  var eq2 = '<blah></blah>' === str;
  assert.deepEqual(true, eq1 || eq2);
  // test hash-of-ints handling
  assert.deepEqual('<blah><a>1</a><b>2</b></blah>', sw.serializeHashXml(
      'blah', {'a': 1, 'b': 2}));
  // tets hash-of-strings handling
  assert.deepEqual('<blah><a>d</a><b>c</b></blah>', sw.serializeHashXml(
      'blah', {'a': 'd', 'b': 'c'}));
  // tets mixed-hash handling
  assert.deepEqual('<blah><a>1</a><b>c</b></blah>', sw.serializeHashXml(
      'blah', {'a': '1', 'b': 'c'}));
};

exports['test_build_int_node_xml'] = function() {
  sw = new swiz.Swiz(def);
  assert.deepEqual(sw.buildIntNode(swiz.SERIALIZATION.SERIALIZATION_XML,
      'blah', 'blag'), '<blah>blag</blah>');
  assert.deepEqual(sw.buildIntNode(swiz.SERIALIZATION.SERIALIZATION_XML,
      'blah', [1, 'blh']), '<blah>1</blah><blah>blh</blah>');
  assert.deepEqual(sw.buildIntNode(swiz.SERIALIZATION.SERIALIZATION_XML,
      'blah', {'a': 'blah', 'b': 1}), '<blah><a>blah</a><b>1</b></blah>');
  assert.deepEqual(sw.buildIntNode(swiz.SERIALIZATION.SERIALIZATION_XML,
      'blah', 1), '<blah>1</blah>');
};

exports['test_build_int_node_json'] = function() {
  sw = new swiz.Swiz(def);
  assert.deepEqual(sw.buildIntNode(swiz.SERIALIZATION.SERIALIZATION_JSON,
      'blah', 'blag'), ['blah', 'blag']);
  assert.deepEqual(sw.buildIntNode(swiz.SERIALIZATION.SERIALIZATION_JSON,
      'blah', [1, 'blh']), ['blah', [1, 'blh']]);
  assert.deepEqual(sw.buildIntNode(swiz.SERIALIZATION.SERIALIZATION_JSON,
      'blah', {'a': 'blah', 'b': 1}), ['blah', {'a': 'blah', 'b' : 1}]);
  assert.deepEqual(sw.buildIntNode(swiz.SERIALIZATION.SERIALIZATION_JSON,
      'blah', 1), ['blah', 1]);
};

exports['test_serial_xml'] = function() {
  blahnode = new Node();
  sw = new swiz.Swiz(def);
  //swiz.loadDefinitions(def);
  sw.serialize(swiz.SERIALIZATION.SERIALIZATION_XML, 1, blahnode,
      function(err, results) 
      {
        // need to make an appointemnt with a DOM for this one.
        assert.deepEqual(results, '<?xml version="1.0" encoding="UTF-8"?>' +
            '<Node><id>15245</id><is_active>true</' +
            'is_active><name>gggggg</name><agent_name>gl&lt;ah</' +
            'agent_name><ipaddress>123.33.22.1</ipaddress>' +
            '<public_ips>123.45.55.44</public_ips>' +
            '<public_ips>122.123.32.2</public_ips></Node>');
        //console.log(results);
      }
  );
};

exports['test_serial_json'] = function() {
  blahnode = new Node();
  sw = new swiz.Swiz(def);
  //swiz.loadDefinitions(def);
  sw.serialize(swiz.SERIALIZATION.SERIALIZATION_JSON, 1, blahnode,
      function(err, results) 
      {
        var rep = JSON.parse(results);
        assert.deepEqual(rep.id, 15245);
        assert.deepEqual(rep.is_active, true);
        assert.deepEqual(rep.name, 'gggggg');
        assert.deepEqual(rep.agent_name, 'gl<ah');
        assert.deepEqual(rep.ipaddress, '123.33.22.1');
        assert.deepEqual(rep.public_ips, ['123.45.55.44', '122.123.32.2']);
      }
  );
};

exports['test_serial_array_xml'] = function() {
  blahnode = new Node();
  blahnode2 = new Node();
  blahnode2.hash_id = '444';
  blahnode2.agent_name = 'your mom';
  var blaharr = [blahnode, blahnode2];
  sw = new swiz.Swiz(def);
  sw.serialize(swiz.SERIALIZATION.SERIALIZATION_XML, 1, blaharr,
      function(err, results)
      {

        assert.deepEqual(results, '<?xml version="1.0" encoding="UTF-8"?>' +
            '<group><Node><id>15245</id><is_active>true</' +
            'is_active><name>gggggg</name><agent_name>gl&lt;ah</' +
            'agent_name><ipaddress>123.33.22.1</ipaddress>' +
            '<public_ips>123.45.55.44</public_ips>' +
            '<public_ips>122.123.32.2</public_ips></Node>' +
            '<Node><id>444</id><is_active>true</' +
            'is_active><name>gggggg</name><agent_name>your mom</' +
            'agent_name><ipaddress>123.33.22.1</ipaddress>' +
            '<public_ips>123.45.55.44</public_ips>' +
            '<public_ips>122.123.32.2</public_ips></Node></group>');
      }
  );
};

exports['test_error_type'] = function() {
  blah = { };
  sw = new swiz.Swiz(def);
  blah.getSerializerType = function() {return 'monito';};
  sw.serialize(swiz.SERIALIZATION.SERIALIZATION_JSON, 1, blah,
      function(err, results)
      {
        assert.ok(err instanceof Error);
      }
  );
};


exports['test_serial_array_json'] = function() {
  blahnode = new Node();
  blahnode2 = new Node();
  blahnode2.hash_id = '444';
  blahnode2.agent_name = 'your mom';
  var blaharr = [blahnode, blahnode2];
  sw = new swiz.Swiz(def);
  sw.serialize(swiz.SERIALIZATION.SERIALIZATION_JSON, 1, blaharr,
      function(err, results)
      {
        var rep = JSON.parse(results);
        assert.deepEqual(rep[0].id, 15245);
        assert.deepEqual(rep[0].is_active, true);
        assert.deepEqual(rep[0].name, 'gggggg');
        assert.deepEqual(rep[0].agent_name, 'gl<ah');
        assert.deepEqual(rep[0].ipaddress, '123.33.22.1');
        assert.deepEqual(rep[0].public_ips,
            ['123.45.55.44', '122.123.32.2']);
        assert.deepEqual(rep[1].id, 444);
        assert.deepEqual(rep[1].is_active, true);
        assert.deepEqual(rep[1].name, 'gggggg');
        assert.deepEqual(rep[1].agent_name, 'your mom');
        assert.deepEqual(rep[1].ipaddress, '123.33.22.1');
        assert.deepEqual(rep[1].public_ips,
            ['123.45.55.44', '122.123.32.2']);
      }
  );
};
