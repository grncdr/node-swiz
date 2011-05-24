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

/* @fileOverview swiz is the serialization framework, built on Lucy's
 *   awesome python-esque version of things.... but for node.js
 *
 *  Major design goals are:
 *  * Allow us to support multiple formats (e.g. JSON & XML)
 *  * Be node.js-esque.
 *  * Not block especially frequently.
 *
 * Writing without a XML generator pimpy thingie because most of them
 * looked to be too much of a pain in the ass.
 *
 * Things that it doesn't presently do:
 * * Prevent you from using clearly-illegal names for things.
 * * Caching
 * * Pagination (this is regarded as a feature, not a bug)
 * * It doesn't try to remap returned arrays or hashes
 * * Probably some other things...
 */

// Required libs:
var async = require('async');


/**
 * The constructor for the swiz class
 * @constructor
 *
 * Notes about the data def.
 *
 * It's first a set of object type definitions.
 *
 * Each object type definition is a list of slots, which is a pair
 * of name and an object containing the metainformation.
 *
 * The metainformation is free-form.  In a DRY fashion, it'll assume
 * that the name is the name of the object's variable.  If it isn't, you
 * can use 'src' to retrieve something else.
 *
 * 'type' is the type (I use thrift's format), 'desc' means the description.
 * These are for making things self-describing down the road.
 *
 * @param {!Object} defs data def.
 */

function Swiz(defs) {
  this.defs = defs;
}


/** Controls if you want to use JSON or XML (or, for that matter, any other
  * weird serialization format people might invent to torment you with)
  *
  * @enum {number}
  */
exports.SERIALIZATION = {
  SERIALIZATION_JSON: 0,
  SERIALIZATION_XML: 1,
  SERIALIZATION_OBJ: 2
};


/** Escape an XML string.
 *
 * @param {string} str string to be escaped.
 * @return {string} entity-replaced version of the string.
 */
Swiz.prototype.xmlEscapeString = function(str) {
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  str = str.replace(/>/g, '&gt;');
  return str;
};


/** build an XML element
 *
 * @param {string} key the tag name.
 * @param {string} item the content of the tag.
 * @return {string} the complete XML element.
 */
Swiz.prototype.xmlElem = function(key, item) {
  if (!key) {
    return item;
  } else {
    return '<' + key + '>' + item + '</' + key + '>';
  }
};


function doReduceJson(memo, item) {
  memo[item[0]] = item[1];
  return memo;
}


function wrap(mode, obj, results) {
  if (mode === exports.SERIALIZATION.SERIALIZATION_XML) {
    if (obj instanceof Array) {
      results = '<group>' + results + '</group>';
    }
    return '<?xml version="1.0" encoding="UTF-8"?>' + results;
  } else if (mode === exports.SERIALIZATION.SERIALIZATION_JSON) {
    return JSON.stringify(results[1]);
  } else {
    return results;
  }
}


/** Serialize internals
  *
  * @private
  * @param {enum} mode The mode of serialization.
  * @param {number} version The version number.
  * @param {!Object} obj The object to be serialized.
  * @param {function} callback The callback to use.
  */
Swiz.prototype._doSerial = function(mode, version, key, obj, callback) {
  var self = this;
  var stype, def, l, i;

  if (obj instanceof Function) {
    obj(function(err, obj) {
      self._doSerial(mode, version, key, obj, callback);
    });
  } else if (obj instanceof Array) {
    async.map(obj, function(obj, callback) {
      self._doSerial(mode, version, key, obj, callback);
    },
    function(err, results) {
      if (err) {
        callback(err, null);
        return;
      }

      if (mode === exports.SERIALIZATION.SERIALIZATION_XML) {
        callback(null, results.join(''));
      } else {
        results = results.map(function(item) {
          return item[1];
        });
        callback(null, [key, results]);
      }
    });
  } else if (obj instanceof Object) {
    stype = obj.getSerializerType();
    def = this.defs[stype];

    if (!def) {
      callback(new Error('No definition for this type; no way to serialize'));
      return;
    }

    function handleDefItem(item, callback) {
      var src = item[1].src || item[0];
      self._doSerial(mode, version, item[0], obj[src], callback);
    }

    function reduceResults(err, results) {
      if (err) {
        callback(err);
      } else if (mode === exports.SERIALIZATION.SERIALIZATION_XML) {
        callback(null, self.xmlElem(key, self.xmlElem(stype,
                                                      results.join(''))));
      } else {
        callback(null, [key, results.reduce(doReduceJson, {})]);
      }
    }

    async.map(def, handleDefItem, reduceResults);
  } else {
    if (mode === exports.SERIALIZATION.SERIALIZATION_XML) {
      callback(null, self.xmlElem(key, self.xmlEscapeString(obj.toString())));
    } else {
      callback(null, [key, obj]);
    }
  }
};


/** Serialize function
  *
  * This is your primary API.  It will look through your pre-set
  * definition structure and try to "do the right thing" as necessary.
  *
  * Your object needs to have a getSerializerType() method so
  * it can know how to serialize it (so that any number of "node"
  * objects can be serialized as a Node).
  *
  * The individual slots (functions or variables) can be node-style
  * callbacks, single objects, arrays, or objects.  It will try to
  * "do the right thing"
  *
  * Version numbers are presently ignored.
  *
  * @param {enum} mode The mode of serialization.
  * @param {number} version The version number.
  * @param {Object|Array} obj The object to be serialized.
  * @param {function} callback The callback to use.
  */

Swiz.prototype.serialize = function(mode, version, obj, callback) {
  this._doSerial(mode, version, null, obj, function(err, results) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, wrap(mode, obj, results));
    }
  });
};



/**
 * The swiz class
 */
exports.Swiz = Swiz;
