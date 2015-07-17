
var path = require('path');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
	res.redirect('/processes');
});

module.exports = router;
