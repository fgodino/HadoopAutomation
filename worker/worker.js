
var Q = require('q'),
	fs = require('fs'),
    exec = require('child_process').exec,
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

	if(!options.process) = return new Error("process field is mandatory");

	this.configured = true;
	
	return mongoDb.findById(options.process).populate('dataset job').exec()
		.then(function(process){

			if(!process.dataset || !process.job) return new Error(); 

			return Q.all([
				Q.ninvoke(connections.s3, 'getObject', {
					Bucket : process.dataset.s3Bucket,
            		Key : process.dataset.s3Key
				}),
				Q.ninvoke(connections.s3, 'getObject', {
					Bucket : process.job.s3Bucket,
            		Key : process.job.s3Key
				})
			])
			.spread(function(datasetObj, jobObj){
				datasetObj.name = process.dataset.s3Key;
				jobObj.name = process.job.s3Key;
				return [datasetObj, jobObj];
			})

		.spread(function(datasetObj, jobObj){ //Write to destination

			self.datasetLocation = process.env.HDFS_PATH + 'inputfile';
			self.jobLocation = '/root/' + jobObj.name;
			return Q.all([
				Q.nfcall(fs.writeFile, datasetLocation, datasetObj.Body),
				Q.nfcall(fs.writeFile, jobLocation, jobObj.Body)
			]);

		})
	});

}

ProcessRunner.prototype.run = function(){

	if(!this.configure) = return new Error("Call configure first");

	var promises = [
		execCommand(this.sbin + "stop-dfs.sh"),
		execCommand(this.sbin + "stop-yarn.sh"),
	    execCommand(this.bin + "hadoop namenode -format -force"),
	    execCommand(this.sbin + "start-dfs.sh"),
		execCommand(this.sbin + "start-yarn.sh"),
	    execCommand(this.bin + "hadoop fs -rm /input/inputfile"),
	    execCommand(this.bin + "hadoop fs -rmr /output"),
	    execCommand(this.bin + "hadoop fs -mkdir /input"),
	    execCommand(this.bin + "hadoop fs -put /tmp/inputfile /input/"),
	    execCommand(this.bin + "hadoop jar " + this.jobLocation " /input/inputfile /output"),    
	    execCommand(this.bin + "hadoop fs -get /output /tmp/"),            
	    execCommand(this.sbin + "stop-dfs.sh"),
		execCommand(this.sbin + "stop-yarn.sh")
	];

	var result = Q();
	promises.forEach(function(promise){
		result = promise.then();
	});

	return result;
};

ProcessRunner.prototype.makeSlaves = function(){

	var self = this;
	var slaves = self.slaves || [];

	return Q.try(function(){
		
		var masterAddress = getLocalAddress();
        var chained = Q();

        slaves.forEach(function(slave){
			chained = execCommand(self.home + "/BackendWorker/syncmaster " + slaves + " " + masterAddress).then();
		});

		return chained;
	})
	.then(function(){

		var chained = Q();

        slaves.forEach(function(slave){
			chained = execCommand("ssh /etc/hosts root@" + slave + ":/etc/hosts").then();
		});

		return chained;
	});
};

ProcessRunner.prototype.releaseSlaves = function(){
	this.slaves = [];
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/slaves"
	return Q.nfcall(fs.writeFile, file, "").done();
}

ProcessRunner.prototype.makeCurrentNodeMaster = function(){
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/masters"
	return Q.nfcall(fs.writeFile, file, "master").done();
};

ProcessRunner.prototype.addSlavesToCluster = function (slaves){
	this.slaves = slaves || [];
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/slaves"
	var slavesString = 'master\n' + this.slaves.join('\n');
	return Q.nfcall(fs.writeFile, file, slavesString).done();
};

function execCommand(command) {
    var defer = Q.defer();

        exec(command, null, function(error, stdout, stderr) {
            return error 
                ? defer.reject(stderr + new Error(error.stack || error))
                : defer.resolve(stdout);
        })

        return defer.promise;
});

module.exports = ProcessRunner;