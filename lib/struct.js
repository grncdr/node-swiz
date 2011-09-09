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


function Obj(name, options) {
  this._name = name;
  options = options ? options : {};
  this._singular = options.singular ? options.singular : name;
  this._plural = options.plural ? options.plural : name;
  this._fields = options.fields ? options.fields : [];
}

function Field(name, options) {
  this._name = name;
  options = options ? options : {};
  this._src =  options.src ? options.src : name;
  this._singular = options.singular ? options.singular : name;
  this._plural = options.plural ? options.plural : name;
  this._desc = options.desc;
  this._val = options.val;
  this._enumerated = options.enumerated;
}

/**
 * This function deals with converting enumerated types from their string
 * versions to the right actual value, hiding some of the complexity of fields.
 */
Field.prototype.valueForObj = function(obj) {
  var k, src = this._src;

  if (this._enumerated) {
    for (k in this._enumerated) {
      if (this._enumerated[k] === obj[src]) {
        return k;
      }
    }
  }

  return obj[src];
};

exports.Obj = function(name, options) {
  return new Obj(name, options);
};

exports.Field = function(name, options) {
  return new Field(name, options);
};
