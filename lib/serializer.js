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
var et = require('elementtree');
var sprintf = require('sprintf').sprintf;

var merge = require('./util').merge;


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
 * @param {!Object} options options for serialization.
 */

function Swiz(defs, options) {
  var defaultOptions = {
    stripNulls: true,
    useAsAttribute: null, // An array of keys which are used as attributes instead of being
                          // used as a separate tag. Only applies to the XML serializer and
                          // elements which have a parent.
  };

  this.defs = defs;
  this.options = merge(defaultOptions, options);
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


/**
 * Given a datastructure supported by Swiz, convert it into an Object that
 * can be serialized directly to JSON, or to XML using Swiz's serializeXml
 * method.
 *
 * @param {object} obj The datastructure to be converted.
 * @param {function} callback A callback fired with (err, result).
 */
Swiz.prototype.buildObject = function(obj, callback) {
  this._buildObject(null, obj, callback);
};


Swiz.prototype._buildObject = function(parent, obj, callback) {
  var self = this;
  var stype, def, result, keys;

  // Call the function and recurse on the value passed to the callback
  if (obj instanceof Function) {
    obj.call(parent, function(err, value) {
      if (err) {
        callback(err);
      } else {
        self._buildObject(null, value, callback);
      }
    });
  }

  // Recurse onto every element of an array
  else if (obj instanceof Array) {
    function iterArr(item, callback) {
      self._buildObject(null, item, callback);
    }

    async.map(obj, iterArr, callback);
  }

  // Recurse onto each property named in the definition
  else if (obj instanceof Object && obj.getSerializerType) {
    stype = obj.getSerializerType();
    def = this.defs[stype];
    result = {};
    Object.defineProperty(result, 'serializerType', {
      value: stype,
      enumerable: false
    });

    if (!def) {
      callback(new Error('No definition for this type; no way to serialize ' + stype));
      return;
    }

    function iterObj(item, callback) {
      var k;
      var prop = item[1];
      var dst = item[0];
      var src = prop.src || dst;

      if (prop.enumerated) {
        for (k in prop.enumerated) {
          if (prop.enumerated[k] === obj[src]) {
            result[dst] = k;
            callback();
            return;
          }
        }
      }

      self._buildObject(obj, obj[src], function(err, value) {
        result[dst] = value;
        callback(err);
      });
    }

    async.forEach(def, iterObj, function(err) {
      callback(err, result);
    });
  }

  // Treat it as a map, recurse onto each property
  else if (obj instanceof Object) {
    keys = Object.keys(obj);
    result = {};

    function iterMap(key, callback) {
      if (!obj.hasOwnProperty(key)) {
        callback();
        return;
      }

      self._buildObject(obj, obj[key], function(err, value) {
        result[key] = value;
        callback(err);
      });
    }

    async.forEach(keys, iterMap, function(err) {
      callback(err, result);
    });
  }

  // Simple value, pass it back
  else {
    callback(null, obj);
  }
};

function pruneNull(key, value) {
  return (value === null || value === undefined) ? undefined : value;
}

/**
 * Convert an "object" constructed by buildObject to JSON. Currently this
 * simply calls JSON.stringify() on the object.
 */
Swiz.prototype.serializeJson = function(obj) {
  return JSON.stringify(obj, this.options.stripNulls ? pruneNull : null, 4);
};

/**
 * Convert an "object" constructed by buildObject to XML. If the object is an
 * Array it will be placed within <group>...</group> tags.
 *
 * @param {object|array} obj The object to be serialized.
 * @returns {string}
 */
Swiz.prototype.serializeXml = function(obj) {
  var elem = null, etree, xml;

  if (obj instanceof Array) {
    elem = new et.Element('group');
  }

  elem = this._serializeXml(elem, obj, null);
  etree = new et.ElementTree(elem);
  xml = etree.write();
  return xml;
};

/**
 * @param {?et.Element|et.SubElement} elem Optional parent element.
 * @param {Object} obj Object to serialize.
 * @param {String} key object key.
 * @return {et.Element|et.SubElement} elementtree element.
 */
Swiz.prototype._serializeXml = function(elem, obj, key) {
  elem = elem || null;
  var i, def, stype, keys, item, type, src, value, result, selem, matches;

  if (obj instanceof Array) {
    if (this.defs.hasOwnProperty(elem.tag)) {
      def = this.getDefinitionForKey(elem.tag, key);
      type = def[1].type;
      // TODO: refactor into a separate function
      matches = type.match('<(.*?)>');

      if (matches) {
        selem = et.SubElement(elem, key);
        key = matches[1];
      }
      else {
        // No definition found for a sub-element
        selem = elem;
      }
    }
    else {
      selem = elem;
    }

    // Treat each member of an array as a separate property with the same key
    for (i = 0; i < obj.length; i++) {
      this._serializeXml(selem, obj[i], key);
    }

    return selem;
  }
  else if (obj instanceof Object && obj.serializerType) {
    // Look up object definitions, serialize each defined property
    def = this.defs[obj.serializerType];
    if (!def) {
      throw new Error('No definition for this type; unable to serialize');
    }

    stype = obj.serializerType;

    if (key) {
      elem = this._addElement(elem, key);
      selem = et.SubElement(elem, stype);
    }
    else {
      elem = selem = this._addElement(elem, stype);
    }

    for (i = 0; i < def.length; i++) {
      item = def[i];
      src = item[0];
      this._serializeXml(selem, obj[src], src);
    }

    return elem;
  }
  else if (obj instanceof Object) {
    // Use all defined keys
    keys = Object.keys(obj);

    elem = this._addElement(elem, key);

    for (i = 0; i < keys.length; i++) {
      if (obj.hasOwnProperty(keys[i])) {
        src = keys[i];

        if (this.options.stripNulls && (obj[keys[i]] === null || obj[keys[i]] === undefined)) {
          continue;
        }
        else {
          this._serializeXml(elem, obj[keys[i]], src);
        }
      }
    }

    return elem;
  }
  else {
    // Serialize individual values
    if ((obj === undefined || obj === null)) {
      return null;
    }

    value = obj.toString();

    if ((this.options.useAsAttribute && this.options.useAsAttribute.indexOf(key) !== -1)) {
      if (!elem) {
        throw new Error(sprintf('%s should be used as an attribute, but it doesn\'t ' +
                                'have a parent element', key));
      }

      elem.set(key, value);
      return elem;
    }
    else {
      return this._addElement(elem, key, null, value);
    }
  }
};


/**
 * Adds a new element to the tree. If a parent element is specified, provided
 * element is added as a SubElement otherwise it is added as a parent.
 * @param {?et.Element|et.SubElement} parent Optional parent.
 * @param {String} tag new element tag.
 * @param {?Object} tag new element attributes.
 * @param {?String} tag new element text.
 */
Swiz.prototype._addElement = function(parent, tag, attributes, text) {
  var e;

  if (parent) {
    e = et.SubElement(parent, tag, attributes);
  }
  else {
    e = new et.Element(tag, attributes, text);
  }

  if (text) {
    e.text = text;
  }

  return e;
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
  var self = this;

  this.buildObject(obj, function(err, result) {
    if (err) {
      callback(err);
      return;
    }

    if (mode === exports.SERIALIZATION.SERIALIZATION_XML) {
      callback(null, self.serializeXml(result));
    } else {
      callback(null, self.serializeJson(result));
    }
  });
};


/**
 * Return definition for the provided key.
 *
 * @param {String} serializerType Serializer type.
 * @param {String} key key.
 * @return {Object} definition for the provided key.
 */
Swiz.prototype.getDefinitionForKey = function(serializerType, key) {
  var defs = this.defs[serializerType], i, len, def;

  if (!defs) {
    throw new Error(sprintf('No definition for type "%s"', serializerType));
  }

  len = defs.length;

  for (i = 0, len = defs.length; i < len; i++) {
    def = defs[i];
    if (def[0] === key) {
      return def;
    }
  }

  return null;
};


/**
 * The swiz class
 */
exports.Swiz = Swiz;
