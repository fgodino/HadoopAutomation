var redis = require('redis');
var redisCli = require('../connections.js').redisDB;
var getWorkers = require('../connections.js').getWorkers;
var workersHelper = require('./workersHelper.js');

var lastChange = 0;
var newChange = 0;

/* Add process to the queue */
var addProcess = function (process, callback) {

  redisCli.zadd('processSet', 1000 , JSON.stringify(process), function (err) {
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
}

/* Update the score of the elements of the set*/
var updateScore = function (callback) {

  var multiQueue = redisCli.multi();
  var elem;
  var newScore = newChange - lastChange;
  redisCli.zrange('processSet', 0, -1, 'withscores', function (err, replies) {

    replies = group(replies);
    for (var i = 0; i < replies.length; i++) {
      elem = {
        score: replies[i][1],
        nodes: JSON.parse(replies[i][0]).nodes
      }

      multiQueue = multiQueue.zincrby('processSet', (newScore / elem.nodes ), replies[i][0]);
    }

    multiQueue.exec(function (err) {
      getFirstElement(function () {
        callback();
      });
    });
  });
}

/* Get the element with the highest score in the set */
var getFirstElement = function (callback) {

  redisCli.zrange('processSet', -1, -1, function (err, res) {
    var nodes = JSON.parse(res).nodes;
    getWorkers(nodes, function (master, slaves) {
      if(master === undefined) {
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

        var key = 'slaves:' + id;
        redisCli.lpush(key, slaves, function (err, res) {
          var msg = master + '::' + key;
          pubSub.notifyNodes(msg);
          cb();
        });
      }
    });
  });
}

/* Aux function needed to group the element and its score */
var group = function (array) {
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
