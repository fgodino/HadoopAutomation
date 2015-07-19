//Modules
var express = require('express');
var router = express.Router();
var Process = require('../models/Process');
var Job = require('../models/Job');
var Dataset = require('../models/Dataset');
var async = require('async');
var queueHelper = require('../api/queueHelper.js');
var SocketEmitter = require('../api/socketEmitter.js');
var redis = require('redis');
var redisCli = require('../connections').redisDB;

var username = "fgodino";

router.post('/', function (req, res) {

	var body = req.body;

	var process = new Process ({
		owner: username,
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
						SocketEmitter.sendMsg(id, 'PROCESSING');
						cb();
					});
				}
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
				.or([{owner : username}, {public : true}])
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
				.or([{owner : username}, {public : true}])
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
			.find({owner: username})
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
			if(err) return res.send(500);
	        var stream = s3.getObject(params).createReadStream();
			res.set({
				'Content-Type': 'application/octet-stream',
				'Content-Disposition' : 'attachment; filename="' + info.Metadata.filename + '"',
				'Content-Length' : info.ContentLength
		  	});
			stream.pipe(res);
		});

    });

});

router.delete('/:id', function (req, response) {

    Process.findById(req.params.id, function (err, process) {
        if(process.owner !== username) {
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
module.exports = router;
