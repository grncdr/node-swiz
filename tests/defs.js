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

var swiz = require('swiz');
var O = swiz.struct.Obj;
var F = swiz.struct.Field;

var def_v2 = [
  O('Node',
    {
    'fields': [
      F('id', {'src': 'hash_id', 'desc': 'hash ID for the node', 'attribute': true}),
      F('is_active', {'src': 'active', 'desc': 'is the node active?'}),
      F('name', {'src' : 'get_name', 'desc' : 'name'}),
      F('agent_name'),
      F('ipaddress' , {'src' : 'get_public_address'}),
      F('public_ips', {'singular': 'ip'}),
      F('state', {'enumerated' : {inactive: 0, active: 1, full_no_new_checks: 2}}),
      F('opts', {'src': 'options'}),
      F('data')
      ],
    'plural': 'nodes'
    }),

  O('NodeOpts',
    {
      'fields': [
        F('option1', {'src': 'opt1'}),
        F('option2', {'src': 'opt2'}),
        F('option3', {'src': 'opt3'}),
      ]
    }),
];

// Mock set of serialization defs
var def = {
  'Node' : [
    ['id' , {'src' : 'hash_id',
      'desc' : 'hash ID for the node'}],
    ['is_active' , {'src' : 'active',
      'desc' : 'is the node active?'}],
    ['name' , {'src' : 'get_name', 'desc' : 'name' }],
    ['agent_name' , {}],
    ['ipaddress' , {'src' : 'get_public_address'}],
    ['public_ips' , {}],
    ['state', {'enumerated' : {inactive: 0, active: 1, full_no_new_checks: 2}}],
    ['opts', {'src': 'options'}],
    ['data', {'src': 'data'}]
  ],
  'NodeOpts': [
    ['option1', {'src': 'opt1'}],
    ['option2', {'src': 'opt2'}],
    ['option3', {'src': 'opt3'}]
  ]
};

exports.def = def;
exports.def_v2 = def_v2;


