var redis = require('redis');
var redisCli = require('../connections').redisDB;

/* Add a worker to the list of available nodes */
var addNode = function (address, callback) {

  redisCli.sadd('availWorkers', address, function (err, res) {
    if (err) {
      console.log('Database insertion error');
      callback(err);
    } else {
      callback();
    }
  });
}

/* Check if there are enough nodes to run the process.
    If the condition is true N nodes are popped from the set.
 */
var getWorkers = function (n, callback) {

  redisCli.smembers('availWorkers', function (err, nWorkers) {
    if (nWorkers < n) {
      cb();
    } else {
      rediscli.srandmember('availWorkers', n. function (err, members) {
        redisCli.srem('availWorkers', members, function (err, res) {
          cb(members);
        })
      });
    }
  });
}

exports.addNode = addNode;
exports.getWorkers = getWorkers;
