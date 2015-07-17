
var Q = require('q'),
	fs = require('fs'),
    execFile = require('child_process').execFile,
    connections = require('../connections'),
    getLocalAddress = require('../util/getLocalAddress'),
    Process = require('../models/Process');

function _secureCb(cb){return cb || function(){}};

var ProcessRunner = function () {

	this.home = process.env.HOME;
	this.bin = this.home + "/hadoop-2.6.0/bin/";
    this.sbin = this.home + "/hadoop-2.6.0/sbin/";

    this.configured = false;

}

ProcessRunner.prototype.configure = function(options){

	var self = this;

	if(!options.process) return new Error("process field is mandatory");

	this.configured = true;
	
	return Q(Process.findById(options.process).populate('dataset job').exec())
		.then(function(proc){

			proc = proc.toJSON();

			if(!proc.dataset || !proc.job) return new Error(); 

			return Q.all([
				Q.ninvoke(connections.s3, 'getObject', {
					Bucket : proc.dataset.s3Bucket,
            		Key : proc.dataset.s3Key
				}),
				Q.ninvoke(connections.s3, 'getObject', {
					Bucket : proc.job.s3Bucket,
            		Key : proc.job.s3Key
				})
			]).spread(function(datasetObj, jobObj){

				return Q.all([
					Q.nfcall(fs.mkdir, '/datasets'),
					Q.nfcall(fs.mkdir, '/jobs')
				])
				.fin(function(){

					console.log("LLEGA");

					return Q.all([
						Q.nfcall(fs.writeFile, '/datasets/dataset', datasetObj.Body),
						Q.nfcall(fs.writeFile, '/jobs/job', jobObj.Body)
					]);
				});

			});
		});

}

ProcessRunner.prototype.run = function(){

	if(!this.configure) return new Error("Call configure first");

	return Q.nfcall(execFile, './launch_work.sh').then(function (text) {
		console.log(text);
	});

};

ProcessRunner.prototype.makeSlaves = function(){

	var self = this;
	var slaves = self.slaves || [];

	
	var masterAddress = getLocalAddress()['eth0'];
    
    var syncMasters = []
    var copyHosts = [];

    slaves.forEach(function(slave){
		syncMasters.push(execCommand("./syncmaster.sh " + slave + " " + masterAddress));
		copyHosts.push(execCommand("ssh /etc/hosts root@" + slave + ":/etc/hosts"));
	});

	return Q.all(syncMasters)
			.then(function(){
				return Q.all(copyHosts);
			});

};



ProcessRunner.prototype.releaseSlaves = function(){
	this.slaves = [];
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/slaves"
	return Q.nfcall(fs.writeFile, file, "");
}

ProcessRunner.prototype.makeCurrentNodeMaster = function(){
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/masters"
	return Q.nfcall(fs.writeFile, file, "master\n");
};

ProcessRunner.prototype.makeCurrentNodeSlave = function(master){

	var file = this.home + "/hadoop-2.6.0/etc/hadoop/masters"
	return Q.nfcall(fs.writeFile, file, "");
};

ProcessRunner.prototype.addSlavesToCluster = function (slaves){
	this.slaves = slaves || [];
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/slaves"
	var slavesString = 'master\n' + this.slaves.join('\n');
	return Q.nfcall(fs.writeFile, file, slavesString);
};

function execCommand(command) {

	var deferred = Q.defer();

	var cmd = exec(command, function(err){
		
		if(err){
			console.log(err);
		}

		deferred.resolve();
	});

	return deferred.promise();

}

module.exports = ProcessRunner;