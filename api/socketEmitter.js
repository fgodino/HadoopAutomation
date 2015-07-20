var io;
var socket;

var createServer = function(server) {

  io = require('socket.io')(server);

  io.on('connection', function (s) {
    socket = s;
  })
};

var sendMsg = function(id, state) {

  var msg = id + ':' + state;

  console.log('MESSAGE: ' + msg);
  socket.emit('updateStatus', msg);
}

exports.createServer = createServer;
exports.sendMsg = sendMsg;
