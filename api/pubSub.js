var redis = require('redis');
var workersHelper = require('./workersHelper.js');
var connectionSub = require('../connections.js').clientSub;
var connectionPub = require('../connections.js').redisDB;
var Process = require('../models/Process');


var PubSub = function (connectionPub, connectionSub) {

    this.connectionPub = connectionPub;
    this.connectionSub = connectionSub;
}

PubSub.prototype.start = function () {

  connectionSub.subscribe('freeprocess', 'workers');
  connectionPub.publish('hello', 'Hello');

  connectionSub.on('message', function (channel, msg) {
    if (channel === 'workers') {
      console.log(msg)
      workersHelper.addNode(msg, function () {
        console.log('done');
      });
    } else if (channel === 'freeprocess' ) {
      var key = 'process:' + msg;
      connectionPub.hgetall(key, function (err, obj) {
        async.parallel([
          function (cb) {
            var query = { _id: msg };
            Process.update(query, { states: 'PROCESSED' }, function () {
              callback();
            });
          },
          function (cb) {
            connectionPub.del(key, function (err, res) {
              cb();
            })
          },
          function (cb) {
              // TO-DO add free nodes to the available nodes list

          }
        ]);
      });
    }
  });
}

PubSub.prototype.notifyNodes = function (id) {

  connectionPub.publish('processes', id);
}

module.exports = new PubSub(connectionPub, connectionSub);

