var redis = require('redis');
var connections = require('../connections');

/* Add a worker to the list of available nodes */
var addNode = function (address, callback) {

  connections.redisDB.sadd('availNodes', address, function (err, res) {
    if (err) {
      console.log('Database insertion error');
    } else {
      callback();
    }
  });
}

/* Check if there are enough nodes to run the process.
    If the condition is true N nodes are popped from the set.
 */
var getNodes = function (n, callback) {

  connections.scard('availNodes', function (err, res) {
    if (n > res) {
      cb();
    } else {
      connections.redisDB.spop('availNodes', n, function (err, res) {
        cb(res);
      });
    }
  });
}
