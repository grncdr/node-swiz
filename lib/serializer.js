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
  SERIALIZATION_XML: 1
};

/* Utility function to print out our definitions
 *
 *
exports.printDefs = function() {
  for (var objname in defs) {
    var obj = def[objname];
    console.log('objname: ' + objname + ' -------------------');
    var l = obj.length;
    for (var i = 0; i < l; i++) {
      keyrec = obj[i];
      prop = keyrec[1];
      key = keyrec[0];
      console.log(' key: ' + key + ' type: ' + prop.type + ' desc:' +
       prop.desc);
    }
  }
};
*/


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
  return '<' + key + '>' + item + '</' + key + '>';
};


/** serialize an array, handling the empty-array case properly
 * @param {string} key the tag name.
 * @param {string} val the array to be serialized.
 * @return {string} serialized array.
 *
 */
Swiz.prototype.serializeArrayXml = function(key, val) {
  var l = val.length, str = '', i = 0, item = '';
  if (l > 0) {
    for (i = 0; i < l; i += 1) {
      item = Swiz.prototype.xmlEscapeString('' + val[i]);
      str = str + Swiz.prototype.xmlElem(key, item);
    }
  } else {
    str = str + '<' + key + '/>';
  }
  return str;
};


/** serialize a hash
 * @param {string} key the tag name.
 * @param {string} val the array to be serialized.
 * @return {string} serialized array.
 *
 */
Swiz.prototype.serializeHashXml = function(key, val) {
  var str = '<' + key + '>', i;
  for (i in val) {
    if (typeof i === 'string') {
      str = str + Swiz.prototype.xmlElem(Swiz.prototype.xmlEscapeString(i),
          Swiz.prototype.xmlEscapeString('' + val[i]));
    }
  }
  str = str + '</' + key + '>';
  return str;
};


/** build an interim node.  For YAML output, this builds an interim
 * form of the structure that we can later fill in.  For XML, this
 * builds an XML sub-string.
 *
 * @param {enum} mode the mode to use -- XML or YAML.
 * @param {string} key either XML tag name or the YAML key.
 * @param {*} val the value. It will try to "do the right thing".
 * @return {string|Array} return value varries depending on the mode.
 *
 */
Swiz.prototype.buildIntNode = function(mode, key, val) {
  if (mode === exports.SERIALIZATION.SERIALIZATION_JSON) {
    return [key, val];
  } else {
    var str, l, i, item;
    key = Swiz.prototype.xmlEscapeString(key);
    if (typeof val === 'object') {
      if (val instanceof Array) {
        return Swiz.prototype.serializeArrayXml(key, val);
      } else {
        return Swiz.prototype.serializeHashXml(key, val);
      }
    } else {
      val = '' + val;
      val = Swiz.prototype.xmlEscapeString(val);
      return Swiz.prototype.xmlElem(key, val);
    }
  }
};


/** do the map phase of the map-reduce.
 *
 * @param {!Object} obj The object to be serialized.
 * @param {enum} mode The mode of serialization.
 * @param {Array} item The definition we're processing.
 * @param {function} callback the callback to return to.
 *
 */
Swiz.prototype.doMap = function(obj, mode, item, callback) {
  var prop = item[1],
      key = item[0],
      src = key,
      val;
  if (prop.src !== undefined) {
    src = prop.src;
  }
  val = obj[src];
  if (typeof obj[src] === 'function') {
    obj[src](function(err, results) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, Swiz.prototype.buildIntNode(mode, key, results));
      }
    });

  } else {
    callback(null, Swiz.prototype.buildIntNode(mode, key, obj[src]));
  }
};

var doReduceJson = function(memo, item, callback) {
  memo[item[0]] = item[1];
  callback(null, memo);
};

var doCallbackJson = function(callback, err, results) {
  if (err) {
    callback(err, null);
  } else {
    callback(null, JSON.stringify(results));
  }
};

var wrap = function(mode, results) {
  if (mode === exports.SERIALIZATION.SERIALIZATION_XML) {
    return '<?xml version="1.0" encoding="UTF-8"?>' + results;
  } else {
    return JSON.stringify(results);
  }
};

/** Serialize internals
  *
  * @private
  * @param {enum} mode The mode of serialization.
  * @param {number} version The version number.
  * @param {!Object} obj The object to be serialized.
  * @param {function} callback The callback to use.
  */

Swiz.prototype.doSerial_ = function(mode, version, obj, callback) {
  var str, def, l, i, that = this;
  if (obj instanceof Array) {
    async.map(obj, function(obj, callback) {
      that.doSerial_.apply(that, [mode, version, obj, callback]);
    },
    function(err, results) {
      if (err) {
        callback(err, null);
      } else {
        if (mode === exports.SERIALIZATION.SERIALIZATION_JSON) {
          callback(null, results);
        } else {
          callback(null, '<group>' + results.join('') + '</group>');
        }
      }
    }
    );
  } else {
    str = obj.getSerializerType();
    def = this.defs[str];
    if (def === undefined) {
      callback(new Error('No definition for this type;' +
          'no way to serialize'), null);
      return;
    }
    async.map(def, async.apply(Swiz.prototype.doMap,
        obj, mode), function(err, results) {
          if (err) {
            callback(err, null);
          } else {
            if (mode === exports.SERIALIZATION.SERIALIZATION_JSON) {
              async.reduce(results, {}, doReduceJson, callback);
            } else {
              callback(null, Swiz.prototype.xmlElem(str, results.join('')));
            }
          }
        }, callback);
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
  this.doSerial_(mode, version, obj, function(err, results) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, wrap(mode, results));
    }
  });
};


/**
 * The swiz class
 */
exports.Swiz = Swiz;
