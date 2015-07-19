
var Q = require('q'),
		fs = require('fs'),
		async = require('async');
    execFile = require('child_process').execFile,
    exec = require('child_process').exec,
    connections = require('../connections'),
    getLocalAddress = require('../util/getLocalAddress'),
    myIP =  require('../util/getLocalAddress')().eth0;
    Process = require('../models/Process'),
    archiver = require('archiver');


function _secureCb(cb){return cb || function(){}};

var ProcessRunner = function () {

	this.home = '/root/';
	this.bin = this.home + "/hadoop-2.6.0/bin/";
	this.sbin = this.home + "/hadoop-2.6.0/sbin/";

	this.configured = false;
	this.archive = archiver('zip');

	process.env.PATH = process.env.PATH+':'+this.bin+':'+this.sbin;
}

ProcessRunner.prototype.configure = function(options, callback){

	var self = this;

	if(!options.process) callback("process field is mandatory");

	this.configured = true;
	
	Process.findById(options.process).populate('dataset job')
		.exec(function(err, proc){

			if(err){
				return callback(err);
			}
			self.proc = proc;

			if(!proc.dataset || !proc.job) return callback(true);

			async.parallel([

					function(cb){
						connections.s3.getObject({
							Bucket : proc.dataset.s3Bucket,
            	Key : proc.dataset.s3Key
						}, cb);
					},
					function(cb){
						connections.s3.getObject({
							Bucket : proc.job.s3Bucket,
            	Key : proc.job.s3Key
						}, cb);
					},
					function(cb){
						fs.mkdir('/datasets', function(){
							cb();
						});
					},
					function(cb){
						fs.mkdir('/jobs', function(){
							cb();
						});
					}
			], function(err, results){

						var datasetObj  = results[0];
						var jobObj 	= results[1];

						self.classname = proc.job.classname;

						if(err){
							return callback(err);
						}

						async.parallel([
							function(cb){
								fs.writeFile('/datasets/dataset', datasetObj.Body, cb);
							},
							function(cb){
								fs.writeFile('/jobs/job', jobObj.Body, cb);
							}
						], callback);

			});
		});
}

ProcessRunner.prototype.run = function(callback){
	if(!this.configure) callback(true);
	console.log(this.classname);
	var out = execFile(__dirname + '/launch_work.sh', [this.classname], {env : process.env}, callback);
	logOutput(out);
};

ProcessRunner.prototype.makeSlaves = function(callback){

	var self = this;
	var slaves = self.slaves || [];
    
  async.parallel(slaves.map(function(slave){
  	return function(cb){
  		var out = execFile(__dirname + "/syncmaster.sh", [slave, myIP], {env : process.env}, callback);
  		logOutput(out);
  	}
  }), callback);

};

ProcessRunner.prototype.releaseSlaves = function(callback){
	this.slaves = [];
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/slaves"
	return fs.writeFile(file, "", callback);
}

ProcessRunner.prototype.makeCurrentNodeMaster = function(callback){
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/masters"
	return fs.writeFile(file, "master\n", callback);
};

ProcessRunner.prototype.makeCurrentNodeSlave = function(master, callback){
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/masters"
	return fs.writeFile(file, "", callback);
};

ProcessRunner.prototype.addSlavesToCluster = function (slaves, callback){
	this.slaves = slaves || [];
	var file = this.home + "/hadoop-2.6.0/etc/hadoop/slaves"
	var slavesString = 'master\n' + this.slaves.join('\n');
	console.log('slaves', slavesString);
	return fs.writeFile(file, slavesString, callback);
};

ProcessRunner.prototype.uploadResults = function(callback){

	var self = this;
    
	self.archive.on('error', function(err) {
    callback(err);
  }); 

  self.archive.directory('/result/output');

  console.log(self.proc);

  var buffers = [];

  self.archive.on('data', function(buffer){
  	buffers.push(buffer);
  });

  self.archive.on('end', function(){

  	var body = Buffer.concat(buffers);

  	console.log(body.length);

	  connections.s3.putObject({
			Bucket : process.env.S3_PROCESSES_BUCKET,
	  	Key : self.proc._id.toString(),
	  	Body : body
		}, function(err){
			
			if(err){
				console.log(err);
				return callback(err);
			}

			self.proc.s3Bucket = process.env.S3_PROCESSES_BUCKET;
			self.proc.s3Key = self.proc._id;

			self.proc.save(callback);

		});
  });


	self.archive.finalize();

};


function logOutput(child){

	child.stderr.on('data', function(data){
		process.stderr.write(data);
	})

	child.stdout.on('data', function(data){
		process.stdout.write(data);
	})

	child.on('error', function(err){
		console.log("ERROR", err);
	});

}

module.exports = ProcessRunner;