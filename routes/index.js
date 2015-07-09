
var path = require('path');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
	res.render('index.ejs', {
		user : req.user,
		message : "",
		datasets : [],
		jobs : []
	});
});

module.exports = router;