var redis = require('redis');
var redisCli = require('../connections.js').redisDB;

/* Add process to the queue */
var addProcess = function (process, callback) {

  redisCli.zadd('jobSet', 1000 , JSON.stringify(process), function (err) {
    if (err) {
      console.log('Database insertion error: ' + err)
      callback(err);
    } else {
      callback();
    }
  });
}

/* Update the score of the elements of the set*/
var updateScore = function (time, callback) {

  var multiQueue = redisCli.multi();
  var newScore;
  var elem;

  redisCli.zrange('jobSet', 0, -1, 'withscores', function (err, replies) {

    replies = group(replies);
    for (var i = 0; i < replies.length; i++) {
      elem = {
        score: replies[i][1],
        nodes: JSON.parse(replies[i][0]).nodes
      }

      multiQueue = multiQueue.zincrby('jobSet', (elem.score / elem.nodes ), replies[i][0]);
    }

    multiQueue.exec(function (err) {
      callback();
    });
  });
}

/* Get the element with the highest score in the set */
var getFirstElement = function (callback) {

  redisCli.zrange('jobSet', -1, -1, function (err, res) {
    callback(res);
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
