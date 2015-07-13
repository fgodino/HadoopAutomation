
var fs = require('fs'),
    AWS = require('aws-sdk'),
    util = require('util'),
    mongoose = require('mongoose'),
    redis = require('redis'),
    async = require('async'),
    EventEmitter = require('events').EventEmitter;

var Connections = function() { //Emmiter for async operations
    var self = this;
    EventEmitter.call(self);

    self.aws = AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    self.s3 = new AWS.S3({endpoint: new AWS.Endpoint(process.env.AWS_S3_ENDPOINT)});

    self.db = mongoose.createConnection(process.env.MONGODB_URL);

    self.redisDB = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

    self.clientSub = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

    console.log('Establishing connetions...');

    async.parallel([

      function(cb) {
        
        self.db.once('open', function() {
          console.log('Mongo db connected');
          cb();
        });

        self.db.once('error', function(err) {
          console.log(err);
          cb(err);
        });
      },
      function (cb) {
        self.redisDB.once('connect', function () {
          console.log('Redis store db connected');
          cb();
        });

        self.redisDB.once('error', function () {
          console.log(err);
          cb(err);
        });
      },
      function (cb) {
        self.clientSub.once('connect', function () {
          console.log('Redis pub/sub connected');
          cb();
        });

        self.clientSub.once('error', function () {
          console.log(err);
          cb(err);
        });
      }
      ], function (err) {
        if(err){
          console.err('Unable to connect:', err);
          return;
        }
        console.log('All connetions established');
        self.emit('connected');
      });
};

util.inherits(Connections, EventEmitter);
module.exports = new Connections();
