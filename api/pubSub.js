var redis = require('redis');
var queueHelper = require('./queueHelper.js');
var workersHelper = require('./workersHelper.js');
var connectionSub = require('../connections.js').clientSub;
var connectionPub = require('../connections.js').redisDB;
var Process = require('../models/Process');
var SocketEmitter = require('./socketEmitter.js');

var PubSub = function (connectionPub, connectionSub) {

    this.connectionPub = connectionPub;
    this.connectionSub = connectionSub;
}

PubSub.prototype.start = function () {

  connectionSub.subscribe(process.env.CHANNEL_FREE, process.env.CHANNEL_WORKERS, process.env.CHANNEL_HELLO);

  connectionSub.on('message', function (channel, msg) {

    console.log('MESSAGE: ' + msg);

    if (channel === process.env.CHANNEL_HELLO && msg !== 'Hello') {
      queueHelper.updateScore(function (id) {
        if (id !== undefined) {
          Process.update({ _id: id }, { states: 'PROCESSING' }, function () {});
          SocketEmitter.sendMsg(id, 'PROCESSING');
        }
      });
    }

    if (channel === process.env.CHANNEL_FREE ) {

      console.log('JOB FINISHED');
      var splitted = msg.split('::');
      var id = splitted[0];
      var status = splitted[1];

      async.parallel([
        function (cb) {
          workersHelper.freeWorkers(id, function () {
            cb();
          })
        },
        function (cb) {
          Process.update({ _id: id }, { states: status }, function () {
          SocketEmitter.sendMsg(id, status);
            cb();
          });
        }
      ], function (err, res) {
        queueHelper.updateScore(function (id) {
          if (id !== undefined) {
            Procces.update({ _id: id }, { states: 'PROCESSING' }, function () {});
            SocketEmitter.sendMsg(id, 'PROCESSING');
          }
        });
      });
    }
  });
}

PubSub.prototype.notifyNodes = function (msg) {

  connectionPub.publish(process.env.CHANNEL_WORKERS, msg);
}

module.exports = new PubSub(connectionPub, connectionSub);

