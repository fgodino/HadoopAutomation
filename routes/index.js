
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

router.get('/logout', function(req, res){
  	res.redirect('https://mydev107.iit.edu/cas/logout');
});

module.exports = router;