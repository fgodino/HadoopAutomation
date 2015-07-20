//Modules
var express = require('express');
var router = express.Router();
var Process = require('../models/Process');
var Job = require('../models/Job');
var Dataset = require('../models/Dataset');
var async = require('async');
var queueHelper = require('../api/queueHelper.js');
var redis = require('redis');
var connections = require('../connections');
var redisCli = connections.redisDB;
var s3 = connections.s3;
var socketEmitter = require('../api/socketEmitter.js')

router.post('/', function (req, res) {

	var body = req.body;

	var process = new Process ({
		owner: req.session.name,
		name: body.name,
		dataset: body.datasetID,
		job: body.jobID,
		nodes: body.nodes,
	});

	async.waterfall([
		function (cb) {
			process.save(function (err, res) {
				cb(err, res);
			});
		},
		function (process, cb) {
			var elem = {
				id: process.id,
				nodes: process.nodes
			};

			queueHelper.addProcess(elem, function (err) {
				cb();
			});
		},
		function (cb) {
			queueHelper.updateScore(function (id) {
				if(id !== undefined) {
					Process.update({ _id: id }, { states: 'PROCESSING' }, function () {
						cb();
					});
				}

				cb();
			});
		}
	], function (err, id, nodes) {

		res.redirect('/processes');
	});
});

router.get('/', function(req, res){

	async.parallel([
		function (cb) {
			Job
			.find()
				.or([{owner : req.session.name}, {public : true}])
					.exec(function(err, result){
					if(err){
						cb(err);
					} else {
						cb(null, result);
					}
			});
		},
		function (cb) {
			Dataset
			.find()
				.or([{owner : req.session.name}, {public : true}])
					.exec(function(err, result){
					if(err){
						cb(err);
					} else {
						cb(null, result);
					}
			});
		},
		function (cb) {
			Process
			.find({owner: req.session.name})
    		.exec(function(err, result){
        	console.log(err);
				if(err){
					cb(err);
				} else {
					cb(null, result);
				}
			});
		}
	], function (err, results) {
		if (err) {
			res.sendStatus(500)
		} else {
			res.render('processes', {
				jobs: results[0],
				datasets: results[1],
				processes: results[2]
			});
		}
	});
});

router.get('/:id', function(req, res){

    Process.findById(req.params.id, function (err, process){

        if(err){
            return res.sendStatus(500);
        }

        process = process.toJSON();
        var params = {
            Bucket : process.s3Bucket,
            Key : process.s3Key
        };

		s3.headObject(params, function(err, info) {
			console.log(params);
			if(err) return res.send(500);
	        var stream = s3.getObject(params).createReadStream();
			res.set({
				'Content-Type': 'application/octet-stream',
				'Content-Disposition' : 'attachment; filename="' + process.name + '-result.zip"',
				'Content-Length' : info.ContentLength
		  	});
			stream.pipe(res);
		});

    });

});

router.delete('/:id', function (req, response) {

    Process.findById(req.params.id, function (err, process) {
        if(process.owner !== req.session.name) {
            res.sendStatus(401);
        } else {
            Process.findByIdAndRemove(req.params.id, function (err) {
            	redisCli.zrem('processSet', req.params.id, function (err, res) {
            		redisCli.del('process:' + req.params.di, function (err, res) {
            			response.sendStatus(200);
            		});
            	});
            });
        }
    });
});

router.put('/:id', function (res, response) {

	Process.findById(req.params.id, function (err, process) {
		if (process.owner !== req.session.name) {
			res.sendStatus(401);
		} else {
			async.series([
				function (cb) {
					Process.update({ _id: process.id }, { states: 'WAITING' }, function () {
						socketEmitter.sendMsg(id, 'WAITING');
						cb();
					});
				},
				function (cb) {
					queueHelper.addProcess(process.id, process.nodes, function () {
						cb();
					});
				},
				function (cb) {
					queueHelper.updateScore(function (id) {
						if(id !== undefined) {
							Process.update({ _id: id }, { states: 'PROCESSING' }, function () {
								cb();
							});

							return;
						}

						cb();
					});
				}
			], function (err, res) {
				res.redirect('/processes');
			});
		}
	});
});

module.exports = router;
