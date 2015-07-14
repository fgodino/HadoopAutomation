
var q 	   = require('q');
var Worker = require('./worker');
var connections = require('../connections');
var myIP =  require('../util/getLocalAddress')().eth0;

function startListen (store, subscriber) {

	subscriber.on('message', function(channel, message){
		
		if(channel === process.env.CHANNEL_WORKERS){
			
			var info = message.split('::');
			if(info[0] !== myIP) return;

			store.lrange(info[1], 0, -1, function(err, slaves){

				if(err){
					return console.err(err);
				}
				startProcess({
					process : info[1].split(':')[1],
					slaves : slaves
				}, finishProcess);
			});
		}

	});
}

function startProcess(info, callback){

	var worker = new Worker();

	var chain = [
		worker.configure({
			process : info.process
		}),
		worker.addSlavesToCluster(info.slaves),
		worker.makeSlaves(),
		worker.makeCurrentNodeMaster(),
		worker.run(),
		worker.releaseSlaves()
	];

	var result = Q();
	chain.forEach(function(promise){
		result = promise.then();
	});

	promise.then(function success(res){
		callback(null, res);
	}, function fail(err){
		callback(err);
	});
}

function finishProcess(err, result){
	console.log(err, result);
}

connections.clientSub.subscribe(process.env.CHANNEL_WORKERS, function(){});
startListen(connections.redisDB, connections.clientSub);