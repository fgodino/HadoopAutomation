/*
  This module provides a singleton that, upon instantiation (i.e. the first time it is imported anywhere),
  connects asynchronously to external services using the settings defined in the environment.
  It stores references to those connections as member variables.

  Once all connections have been established, resolves the Connections#connected promise.
  Example usage:
      connections = require('./connections.js');
      connections.connected.then(doSomething());

  Connections used to be an EventEmitter that would emit a 'connected' event when complete, but the event handler
  swallows up exceptions, so that sucked.

  Connections#curator
      The mongoose Connection to the curator database
  Connections#website
      The mongoose Connection to the website database
*/

var fs = require('fs'),
    AWS = require('aws-sdk'),
    util = require('util'),
    mongoose = require('mongoose'),
    EventEmitter = require('events').EventEmitter

var Connections = function() { //Emmiter for async operations
    var self = this;
    EventEmitter.call(self);

    self.aws = AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    self.s3 = new AWS.S3({endpoint: new AWS.Endpoint(process.env.AWS_S3_ENDPOINT)});

    self.db = mongoose.createConnection(process.env.MONGODB_URL);

    aync.parallel([
      function(cb) {
        self.db.once('open', function() {
          cb();
        });

        self.db.once('error', function(err) {
          console.log(err);
          cb(err);
        });
      },
      function (cb) {}
        mqHelper.startExchange(url, function (connObj) {
          self.rabbitConnection = connObj;
          cb();
        });
      ], function (err) {
        self.emit('connected');
      });
};

util.inherits(Connections, EventEmitter);
module.exports = new Connections();
