/**
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
  this.name = name;
  options = options ? options : {};
  this.singular = options.singular ? options.singular : name.toLowerCase();
  this.plural = options.plural ? options.plural : name.toLowerCase();
  this.fields = options.fields ? options.fields : [];
}

function Field(name, options) {
  this.name = name;
  options = options ? options : {};
  this.src =  options.src ? options.src : name;
  this.singular = options.singular ? options.singular : name.toLowerCase();
  this.plural = options.plural ? options.plural : name.toLowerCase();
  this.desc = options.desc;
  this.val = options.val;
  this.attribute = options.attribute || false;
  this.enumerated = options.enumerated;
  this.type = options.type || '';
}


/**
 * This function deals with converting enumerated types from their string
 * versions to the right actual value, hiding some of the complexity of fields.
 */
Field.prototype.valueForObj = function(obj) {
  var k, src = this.src;

  if (this.enumerated) {
    for (k in this.enumerated) {
      if (this.enumerated[k] === obj[src]) {
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
