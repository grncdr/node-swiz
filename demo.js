var swiz = require('./lib/swiz');
var Swiz = require('./lib/swiz').Swiz;
var Valve = require('./lib/swiz').Valve;
var Chain = require('./lib/swiz').Chain;
var defToValve = require('./lib/swiz').defToValve;
var O = swiz.struct.Obj;
var F = swiz.struct.Field;

// Note: There's one set of definitions that control both serialization
// and validation
var def = [
  O('Node',
    {
      'fields': [
        F('key', {'val' : new Chain()}),
        F('ip_address_v4', {'val' : new Chain().isIP()})
      ],

      'plural': 'nodes'
    })
];

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
  var sw = new Swiz(def);
  if (err) {
    console.error(err);
  } else {
    console.log('\n\nserialize an object\n');
    cleaned.getSerializerType = function() {return 'Node';};
    sw.serialize(swiz.SERIALIZATION.SERIALIZATION_JSON, 1, cleaned,
      function(err, results) {
        console.log(results);
      }
    );
  }
});
