
var Worker = require('./worker');
var connections = require('../connections');
var myIP =  require('../util/getLocalAddress')().eth0;
var async = require('async');
var fs = require('fs');

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
		worker.configure.bind(worker, { process : info.process }),
		worker.addSlavesToCluster.bind(worker, info.slaves),
		worker.makeSlaves,
		worker.makeCurrentNodeMaster,
		worker.run,
		worker.releaseSlaves,
		worker.uploadResults
	];

	async.series(chain.map(function(f){
		return function(cb){
			f.call(worker, cb);
		}
	}), function(err){
		connections.redisDB.publish(process.env.CHANNEL_FREE, [info.process, (err) ? 'FAILED' : 'SUCESS'].join(':'));
	});
}

function autoDiscovery(store, subscriber){

	var myDsa = fs.readFileSync('/root/.ssh/id_dsa.pub', {encoding : 'utf8'});

	subscriber.on('message', function(channel, message){
		if(channel === process.env.CHANNEL_DISCOVERY){


			message = message.split(':');
			var type = message[0], ip = message[1], dsa = message[2];

			if(type === 'pong' && ip !== myIP) return;
			
			console.log(dsa);

			execFile(__dirname + "/copy_key.sh", [dsa], function(err){
				if(err){
					return console.log(err);
				}
				if(type === 'ping'){
					var myDsaMsg = ['pong', ip, myDsa].join(':');
					store.publish(process.env.CHANNEL_DISCOVERY, myDsaMsg);
				}
			});
		}
	});

	store.publish(process.env.CHANNEL_DISCOVERY, ['ping', myIP, myDsa].join(':'));
}

connections.clientSub.subscribe(process.env.CHANNEL_WORKERS);
connections.clientSub.subscribe(process.env.CHANNEL_DISCOVERY);
connections.on('connected', function(){
	autoDiscovery(connections.redisDB, connections.clientSub);
	startListen(connections.redisDB, connections.clientSub);

	connections.redisDB.sadd(process.env.SET_AVAILABLE_WORKERS, myIP, function(){
		setTimeout(function(){ //Wait to have a stable cluster
			connections.redisDB.publish(process.env.CHANNEL_HELLO, myIP);
		}, 10000);
	});
});