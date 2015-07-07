var amqp = require('amqp');

var startExchange = function (url) {

  var connection = amqp.createConnection(url);
  var res;

  connection.on('ready', function () {
    console.log('connected to RabbitMQ server');

    connection.queue('jobsQueue', { durable: true, autodelete: false }, function (queue) {
      console.log('Queue created: ' + queue.name);

      queue.bind('#');
      queue.on('queueBindOk', function () {
        res = {
          connection: connection,
          queueName: queue.name
        };

        callback(res);
      });
    });
  });
}

var queueMsg = function (connObj, msg, callback) {

  var connection = connObj.connection;

  connection.publish(connObj.name, msg, function () {
    callback();
  });
}
