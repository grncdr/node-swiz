exports.isPort = function(value, baton) {
  value = parseInt(value, 10);

  if (value < 1 || value > 65535) {
    throw new Error('Value out of range [1,65535]');
  }

  return value;
};
