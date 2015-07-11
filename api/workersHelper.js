var redis = require('redis');
var redisCli = /*require('../connections').redisDB;*/ redis.createClient(6379, 'localhost');

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
var getNodes = function (id, n, callback) {

  connections.scard('availNodes', function (err, res) {
    if (n > res) {
      cb();
    } else {
      redisCli.spop('availNodes', n, function (err, res) {
        var nodesKey = 'nodes:' + id;
        redisCli.sadd(nodesKey, res, function (err, response) {
          redisCli.hmset('process:' + id, { 'nodes': nodesKey }, function (err, reply) {
            cb(reply);
          });
        })
      });
    }
  });
}

exports.addNode = addNode;
exports.getNodes = getNodes;
