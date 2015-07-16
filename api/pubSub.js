var redis = require('redis');
var queueHelper = require('./queueHelper.js');
var workersHelper = require('./workersHelper.js');
var connectionSub = require('../connections.js').clientSub;
var connectionPub = require('../connections.js').redisDB;
var Process = require('../models/Process');


var PubSub = function (connectionPub, connectionSub) {

    this.connectionPub = connectionPub;
    this.connectionSub = connectionSub;
}

PubSub.prototype.start = function () {

  connectionSub.subscribe(process.env.CHANNEL_FREE, process.env.CHANNEL_WORKERS);

  connectionSub.on('message', function (channel, msg) {
    if (channel === process.env.CHANNEL_FREE ) {

      var splitted = msg.splice(':');
      connectionPub.smembers(msg, function (err, workers) {
        async.parallel([
          function (cb) {
            var query = { _id: splitted[1] };
            Process.update(query, { states: 'PROCESSED' }, function () {
              cb();
            });
          },
          function (cb) {
            connectionPub.del(msg, function (err, res) {
              workersHelper.addWorkers(workers, function () {
                cb();
              });
            });
          }
        ], function (err, res) {
          queueHelper.updateScores(function () {});
        });
      });
    }
  });
}

PubSub.prototype.notifyNodes = function (msg) {

  console.log('MESSAGE SENT');
  console.log('CHANNEL: ' + process.env.CHANNEL_WORKERS);
  connectionPub.publish(process.env.CHANNEL_WORKERS, msg);
}

module.exports = new PubSub(connectionPub, connectionSub);

