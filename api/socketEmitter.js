var ios = require('socket.io-express-session');

var socket;
var clients = {};

var createServer = function(server, session) {
  var io = require('socket.io')(server);
  io.use(ios(session)); // session support
  io.on('connection', function (socket){
    console.log('session: ' + socket.handshake.session.id);
    clients[socket.handshake.session.name] = socket;
  });

};

var sendMsg = function(name, id, state) {

  var msg = id + ':' + state;

  console.log('MESSAGE: ' + msg);
  clients[name].emit('updateStatus', msg);
}

exports.createServer = createServer;
exports.sendMsg = sendMsg;
