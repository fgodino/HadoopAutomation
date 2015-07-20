var redis = require('redis');
var queueHelper = require('./queueHelper.js');
var workersHelper = require('./workersHelper.js');
var connectionSub = require('../connections.js').clientSub;
var connectionPub = require('../connections.js').redisDB;
var async = require('async');
var Process = require('../models/Process');
var socketEmitter = require('./socketEmitter.js');

var PubSub = function (connectionPub, connectionSub) {

    this.connectionPub = connectionPub;
    this.connectionSub = connectionSub;
}

PubSub.prototype.start = function () {

  connectionSub.subscribe(process.env.CHANNEL_FREE, process.env.CHANNEL_WORKERS, process.env.CHANNEL_HELLO);

  connectionSub.on('message', function (channel, msg) {

    if (channel === process.env.CHANNEL_HELLO && msg !== 'Hello') {
      queueHelper.updateScore(function (id) {
        if (id !== undefined) {
          Process.findById(id, function (err, proc) {
            proc.states = 'PROCESSING';
            proc.save();
            socketEmitter.sendMsg(proc.owner, id, 'PROCESSING');
          });
        }
      });
    }

    if (channel === process.env.CHANNEL_FREE ) {

      console.log('JOB FINISHED: ' + msg);
      var splitted = msg.split(':');
      var id = splitted[0];
      var status = splitted[1];

      async.parallel([
        function (cb) {
          workersHelper.freeWorkers(id, function () {
            cb();
          })
        },
        function (cb) {
          Process.findById(id, function (err, proc) {
            proc.states = status;
            proc.save();
            socketEmitter.sendMsg(proc.owner, id, status);
            cb();
          });
        }
      ], function (err, res) {
        queueHelper.updateScore(function (id) {
          if (id !== undefined) {
            Process.findById(id, function (err, proc) {
              proc.states = 'PROCESSING';
              proc.save();
              socketEmitter.sendMsg(proc.owner, id, 'PROCESSING');
            });
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

