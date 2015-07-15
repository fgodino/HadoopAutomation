
var Q 	   = require('q');
var Worker = require('./worker');
var connections = require('../connections');
var myIP =  require('../util/getLocalAddress')().eth0;

function startListen (store, subscriber) {

	subscriber.on('message', function(channel, message){
		
		if(channel === process.env.CHANNEL_WORKERS){
			
			var info = message.split('::');
			if(info[0] !== myIP) return;

			store.smembers(info[0], function(err, slaves){

				slaves = slaves.slice(1, slaves.length);

				var processId = info[1].split(':')[1];

				if(err){
					return console.error(err);
				}
				startProcess({

					process : processId,
					slaves : slaves

				}, function(){
					store.publish(process.env.CHANNEL_FREE, info[1])
				});
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
		result = result.then(promise);
	});

	Q.try(function(){
		result.then(function success(res){
			callback(null, res);
		}, function fail(err){
			callback(err);
		});
	}).catch(function(err){
		console.log("ERROR--", err);
	});
}

connections.clientSub.subscribe(process.env.CHANNEL_WORKERS, function(){});
startListen(connections.redisDB, connections.clientSub);