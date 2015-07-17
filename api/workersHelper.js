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
      callback();
    } else {
      workers = workers.slice(0, n);
      redisCli.srem('availWorkers', workers, function (err, res) {
        console.log('workers: ' + workers)
        callback(workers);
      });
    }
  });
}

exports.addWorkers = addWorkers;
exports.getWorkers = getWorkers;
