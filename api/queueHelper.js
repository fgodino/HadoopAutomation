var redis = require('redis');
var redisCli = require('../connections.js').redisDB;
var getWorkers = require('./workersHelper.js').getWorkers;
var workersHelper = require('./workersHelper.js');
var pubSub = require('./pubSub.js');
var async = require('async');

var lastChange = 0;
var newChange = 0;

/* Add process to the queue */
var addProcess = function (process, callback) {

  redisCli.set('process:' + process.id, process.nodes, function (err) {
    redisCli.zadd('processSet', 1000 , process.id, function (err) {
      if (err) {
        console.log('Database insertion error: ' + err)
        callback(err);
      } else {
        if (lastChange != 0) {
          lastChange = newChange;
          newChange = Date.now();
        } else {
          var aux = Date.now();
          newChange = aux;
          lastChange = aux;
        }
        callback();
      }
    });
  });
}

/* Update the score of the elements of the set*/
var updateScore = function (callback) {

  var multiQueue = redisCli.multi();
  var newScore = newChange - lastChange;
  redisCli.zrange('processSet', 0, -1, function (err, replies) {
    async.parallel(replies.map(function (reply) {
      return function (callback) {
        redisCli.get('process:' + reply, function (err, nodes) {

          multiQueue = multiQueue.zincrby('processSet', (newScore / parseInt(nodes)), reply);
          callback();
        });
      }
    }), function (err) {
      multiQueue.exec(function (err) {
        getFirstElement(function (id) {
          callback(id);
        });
      });
    })
  });
}

/* Get the element with the highest score in the set */
var getFirstElement = function (callback) {

  redisCli.zrange('processSet', -1, -1, function (err, process) {
    if (!process || !process.length) return;
    redisCli.get('process:' + process, function (err, nodes) {
      nodes = parseInt(nodes);
      getWorkers(nodes, function (err, workers) {
        if(workers === undefined) {
          callback();
        } else {
          if (lastChange != 0) {
            lastChange = newChange;
            newChange = Date.now();
          } else {
            var aux = Date.now();
            newChange = aux;
            lastChange = aux;
          }

          var key = 'workers:' + process;
          redisCli.sadd(key, workers, function (err, res) {
            redisCli.zrem('processSet', process, function (err, res) {
              redisCli.del('process:' + process, function (err, res) {
                var msg = workers[0] + '::' + key;
                pubSub.notifyNodes(msg);
                callback(process);
              });
            });
          });
        }
      });
    });
  });
}

/* Aux function needed to group the element and its score */
function group (array) {
  var aux;
  var newArray = [];

  for (var i = 0; i < array.length; i += 2) {
    aux = [(array[i]), (array[i+1])];
    newArray.push(aux);
  }

  return newArray;
}

// var client = redis.createClient(6379, 'localhost');

/*var elem1 = {
  owner: 'user1',
  nodes: 2
}

var elem2 = {
  owner: 'user2',
  nodes: 3
}

addProcess(elem1, client, function (res) {
  console.log('done');
  addProcess(elem2, client, function (res) {
    console.log('done2');
  })
});*/

/*updateScore(client, 2000, function () {
  console.log('done');
})*/

exports.addProcess = addProcess;
exports.updateScore = updateScore;
exports.getFirstElement = getFirstElement;
