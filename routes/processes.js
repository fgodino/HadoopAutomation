//Modules
var express = require('express');
var router = express.Router();
var Process = require('../models/Process');
var async = require('async');

var username = "fgodino";

router.get('/', function (req, res) {
	Process
		.find({owner : username})
		.exec(function(err, processes){
			if(err) return res.send(400);
			res.send(processes);
		});
});

router.post('/', function (req, res) {

	var body = req.body;
	console.log("UNOOOdsfsdO", req.body)

	var process = new Process ({
		owner: username,
		name: body.name,
		dataset: body.datasetID,
		job: body.jobID,
		nodes: body.nodes
	});
	console.log('entra');
	async.waterfall([
		function (cb) {
			process.save(function (err, res) {
				console.log(err)
				cb(err, res);
			});
		},
		function (process, cb) {
			var elem = {
				id: process.id,
				nodes: process.nodes
			};

			queueHelper.addProcess(elem, function (err) {
				console.log('inserta en la cola')
				cb();
			});
		},
		function (cb) {
			queueHelper.updateScore(function () {
				console.log('calcula score')
				cb()
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

		res.send(200);
	});
});


module.exports = router;
