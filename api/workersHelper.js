var redis = require('redis');
var redisCli = require('../connections').redisDB;

/* Add a worker to the list of available nodes */
var addWorkers = function (workers, callback) {

  redisCli.sadd('availWorkers', workers, function (err, res) {
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

  redisCli.smembers('availWorkers', function (err, workers) {
    if (workers.length < n) {
      cb();
    } else {
      workers = workers.slice(0, n - 1);
      redisCli.srem('availWorkers', workers, function (err, res) {
        cb(workers);
      });
    }
  });
}

exports.addNode = addNode;
exports.getWorkers = getWorkers;
