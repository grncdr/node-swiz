var Swiz = require('swiz').Swiz;
var Valve = require('swiz').Valve;
var Chain = require('swiz').Chain;
var defToValve = require('swiz').defToValve;

// Note: There's one set of definitions that control both serialization
// and validation
var def = {
'Node': [
  ['key', {'val' : new Chain()}],
  ['ip_address_v4', {'val' : new Chain().isIP()}]
]};

var validity = defToValve(def);
var schema = validity.Node;
var v = new Valve(schema);

// Generic payload
var CreatePayload = {
  key: '1234',
  ip_address_v4: '1.2.0.4'
};

console.log('validate a payload:\n');

// Validate the generic payload
v.check(CreatePayload, function(cleaned, err) {
  var swiz = new Swiz(def);
  if (err) {
    console.error(err);
  } else {
    console.log('\n\nserialize an object\n');
    cleaned.getSerializerType = function() {return 'Node';};
    sw.serialize(validate.SERIALIZATION.SERIALIZATION_JSON, 1, cleaned,
      function(err, results) {
        console.log(results);
      }
    );
  }
});
