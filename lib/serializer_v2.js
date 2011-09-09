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
var util = require('util');

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
 * @param {!Array} defs data def.
 */

function Swiz(defs) {
  var i, o;

  this._defs = {};
  for (i = 0; i < defs.length; i++) {
    o = defs[i];
    this._defs[o._name] = o;
  }
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




function Emitter(defs, partial) {
  this._defs = defs;
  this._partial = partial;
  this._result = "";
};

function notImpl(name) {
  return function() {
    throw new Error('Implement '+ name +' in your child funciton');
  }
}

Emitter.prototype.render = function(obj, callback) {
  var self = this;
  this._render(null, obj, function(err) {
    if (err) {
      callback(err);
    }
    else {
      callback(null, self._result);
    }
  });
};

function XMLEmitter(defs, partial) {
  Emitter.call(this, defs, partial);
  this._tagStack = [];

  if (!this._partial) {
    this._result += '<?xml version="1.0" encoding="UTF-8"?>\n';
  }
};
util.inherits(XMLEmitter, Emitter);


XMLEmitter.prototype._startArray = function(name) {
  if (name == null) {
    name = "group";
  }
  if (name instanceof Object) {
    throw new Error('fucked');
  }
  this._tagStack.push(name);
  this._startTag(name);
};

XMLEmitter.prototype._endArray = function() {
  this._endTag(this._tagStack.pop());
}

XMLEmitter.prototype._startObj = function(name) {
  this._tagStack.push(name);
  this._startTag(name);
};

XMLEmitter.prototype._endObj = function() {
  this._endTag(this._tagStack.pop());
}

XMLEmitter.prototype._startTag = function(name) {
  this._result += '<' + name + '>';
};

XMLEmitter.prototype._endTag = function(name) {
  this._result += '</' + name + '>\n';
};

XMLEmitter.prototype._strValue = function(value) {
  if (value !== undefined) {
    this._result += this.xmlEscapeString(value.toString());
  }
};


/** Escape an XML string.
 *
 * @param {string} str string to be escaped.
 * @return {string} entity-replaced version of the string.
 */
XMLEmitter.prototype.xmlEscapeString = function(str) {
  str = str.replace(/&/g, '&amp;');
  str = str.replace(/</g, '&lt;');
  str = str.replace(/>/g, '&gt;');
  return str;
};


XMLEmitter.prototype._render = function(parent, obj, callback) {
  this._buildObject(parent, obj, function(err, obj) {
    if (err) {
      callback(err);
    }
    else {
      callback(null);
    }
  });
};

XMLEmitter.prototype._buildObject = function(parent, obj, callback) {
  var self = this;
  var stype, def, keys;

  if (obj instanceof Function) {
    obj.call(parent, function(err, value) {
      if (err) {
        callback(err);
      }
      else {
        self._buildObject(null, value, callback);
      }
    });
  }
  // Recurse onto every element of an array
  else if (obj instanceof Array) {
    self._startArray(parent);

    function iterArr(item, callback) {
      self._buildObject(parent, item, callback);
    }

    async.map(obj, iterArr, function(err) {
      self._endArray();
      callback(err);
    });
  }
  // Recurse onto each property named in the definition
  else if (obj instanceof Object && obj.getSerializerType !== undefined) {
    console.log('------ in object with seralizer');
    stype = obj.getSerializerType();
    def = this._defs[stype];

    if (!def) {
      callback(new Error('No definition for this type; no way to serialize ' + stype));
      return;
    }

    function iterObj(field, callback) {
      var k;
      var dst = field._name;
      var v = field.valueForObj(obj);

      if (v instanceof Array) {
        self._startObj(field._plural);
      }
      else {
        self._startObj(field._singular);
      }
      console.log('descending into: '+ field._name);
      self._buildObject(field._singular, v, function(err, value) {
        self._strValue(value);
        self._endObj();
        callback(err);
      });
    }

    self._startObj(def._singular);
    async.forEach(def._fields, iterObj, function(err) {
      self._endObj();
      callback(err);
    });
  }
  // Treat it as a map, recurse onto each property
  else if (obj instanceof Object) {
    console.log('------ in object without seralizer');
    console.log(obj);
    console.log('---------------');
    keys = Object.keys(obj);

    function iterMap(key, callback) {
      if (!obj.hasOwnProperty(key)) {
        callback();
        return;
      }
      self._startObj(key);
      self._buildObject(null, obj[key], function(err, value) {
        self._strValue(value);
        self._endObj();
        callback(err);
      });
    }

    self._startObj('object');
    async.forEach(keys, iterMap, function(err) {
      self._endObj();
      callback(err);
    });
  }
  // Simple value, pass it back
  else {
    console.log('   singal value, passing it up: '+ obj);
    self._strValue(obj);
    callback(null);
  }
};

function JSONEmitter(defs, partial) {
  Emitter.call(this, defs, partial);
};
util.inherits(JSONEmitter, Emitter);

JSONEmitter.prototype._render = function(parent, obj, callback) {
  var self = this;

  if (parent == null && obj instanceof Array) {
    obj = {'items': obj};
  }

  this._buildObject(parent, obj, function(err, obj) {
    if (err) {
      callback(err);
    }
    else {
      self._result = JSON.stringify(obj, null, 4);
      callback(null);
    }
  });
};

JSONEmitter.prototype._buildObject = function(parent, obj, callback) {
  var self = this;
  var stype, def, result, keys;

  if (obj instanceof Function) {
    obj.call(parent, function(err, value) {
      if (err) {
        callback(err);
      }
      else {
        self._buildObject(parent, value, callback);
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
  else if (obj instanceof Object && obj.getSerializerType !== undefined) {
    stype = obj.getSerializerType();
    def = this._defs[stype];
    result = {};

    if (!def) {
      callback(new Error('No definition for this type; no way to serialize ' + stype));
      return;
    }

    function iterObj(field, callback) {
      var k;
      var dst = field._name;
      var v = field.valueForObj(obj);

      self._buildObject(obj, v, function(err, value) {
        result[dst] = value;
        callback(err);
      });
    }

    async.forEach(def._fields, iterObj, function(err) {
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

Swiz.prototype._serializeXml = function(obj, key) {
  var i, def, stype, keys, item, src, result;

  // Treat each member of an array as a separate property with the same key
  if (obj instanceof Array) {
    result = '';
    for (i = 0; i < obj.length; i++) {
      result += this._serializeXml(obj[i], key);
    }
    return result;
  }

  // Look up object definitions, serialize each defined property
  else if (obj instanceof Object && obj.serializerType) {
    def = this.defs[obj.serializerType];
    if (!def) {
      throw new Error('No definition for this type; unable to serialize');
    }

    stype = this.xmlEscapeString(obj.serializerType);

    result = this._startTag(key) + this._startTag(stype);

    for (i = 0; i < def.length; i++) {
      item = def[i];
      src = item[0];
      result += this._serializeXml(obj[src], this.xmlEscapeString(src));
    }

    return result + this._endTag(stype) + this._endTag(key);
  }

  // Use all defined keys
  else if (obj instanceof Object) {
    keys = Object.keys(obj);
    result = this._startTag(key);

    for (i = 0; i < keys.length; i++) {
      if (obj.hasOwnProperty(keys[i])) {
        result += this._serializeXml(obj[keys[i]], this.xmlEscapeString(keys[i]));
      }
    }

    return result + this._endTag(key);
  }

  // Serialize individual values
  else {
    if (!obj) {
      return '';
    }
    return this._startTag(key) + this.xmlEscapeString(obj.toString()) + this._endTag(key);
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
  * @param {Object|Array} obj The object to be serialized.
  * @param {function} callback The callback to use.
  */
Swiz.prototype.serialize = function(mode, obj, callback) {
  var self = this;
  var ser;


  if (mode === exports.SERIALIZATION.SERIALIZATION_XML) {
    ser = new XMLEmitter(this._defs);
  } else {
    ser = new JSONEmitter(this._defs);
  }

  ser.render(obj, function(err, result) {
    if (err) {
      callback(err);
      return;
    }
    else {
      callback(null, result);
    }
  });
};


/**
 * The swiz class
 */
exports.Swiz = Swiz;
