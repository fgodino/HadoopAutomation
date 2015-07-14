var redis = require('redis');
var redisCli = require('../connections').redisDB;

/* Add a worker to the list of available nodes */
var addNode = function (address, callback) {

  redisCli.sadd('availNodes', address, function (err, res) {
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

  redisCli.llen('availMasters', function (err, res) {
    if (res === 0) {
      cb();
    } else {
      redisCli.lpop('availMasters', function (err, master) {
        if (n === 1) {
          callback(master);
        } else {
          redisCli.lrange('availSlaves', 0, (n - 2), function (err, members) {
            if ((members.length + 1 ) >= n) {

              var multiQueue = redisCli.multi();
              for (var i = 0; i < n; i++) {
                multiQueue = redisCli.lrem('availSlaves', 1, members[i]);
              }

              multiQueue.exec(function (err) {
                callback(master, members);
              });
            } else {
              cb();
            }
          });
        }
      });
    }
  });
}

exports.addNode = addNode;
exports.getWorkers = getWorkers;
