//Modules
var express = require('express');
var router = express.Router();
var Process = require('../models/Process');
var Job = require('../models/Job');
var Dataset = require('../models/Dataset');
var async = require('async');
var queueHelper = require('../api/queueHelper.js')

var username = "fgodino";

router.post('/', function (req, res) {

	var body = req.body;

	var process = new Process ({
		owner: username,
		name: body.name,
		dataset: body.datasetID,
		job: body.jobID,
		nodes: body.nodes
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
			queueHelper.updateScore(function () {
				cb();
			});
		}/*,
		function (cb) {
			queueHelper.getFirstElement(function (id, nodes) {
				if (id === undefined) {
					cb();
				} else {
					var query = { _id: id };
					Process.update(query, { states: 'PROCESSING'}, function () {
						callback(null, id, nodes);
					});
				}
			});
		}*/
	], function (err, id, nodes) {
		// TO-DO hadoop logic

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

module.exports = router;
