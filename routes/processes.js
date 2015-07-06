//Modules
var express = require('express');
var router = express.Router();
var Process = require('../models/Process');

var username = "fgodino";

router.get('/', function (req, res) {
	Process
		.find({owner : username})
		.exec(function(err, processes){
			if(err) return res.send(400);
			res.send(processes);
		});
});

module.exports = router;