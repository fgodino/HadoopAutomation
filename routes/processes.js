//Modules
var express = require('express');
var router = express.Router();
var Process = require('../models/Process');
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

	console.log('entra');
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

		res.send(200);
	});
});

router.get('/', function(req, res){

  console.log(req.session);


	Process
	.find({owner: username})
    .exec(function(err, result){
        console.log(err);
		if(err){
			return res.sendStatus(500);
		}
				return res.render('processes', {
            processes : result
        });
	});

});

module.exports = router;
