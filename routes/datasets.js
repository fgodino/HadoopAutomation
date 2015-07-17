//Modules
var express = require('express');
var router = express.Router();
var Dataset = require('../models/Dataset');
var async = require('async');
var sanitize = require("sanitize-filename");

var s3 = require('../connections').s3;

var username = "fgodino";

router.post('/', function(req, res){

	var data = {}, buffer;

    req.busboy.once('file', function(fieldname, file) {

        var bufs = [];

        file.on('data', function(d) {
        	bufs.push(d);
        });
        file.on('end', function() {
            buffer = Buffer.concat(bufs);
        });
    });

    req.busboy.on('field', function(name, val) {
        data[name] = val;
    });

    req.busboy.on('finish', function() {

    	if(!data.name || !buffer){
    		return res.send(400, 'Missing filename or file');
    	}

    	var dataset = new Dataset({
    		name : data.name,
    		owner : username,
    		public : data.public || false,
    		s3Bucket : req.app.get('s3 datasets bucket'),
    		s3Key : username + '/' + sanitize(data.name)
    	});

    	async.waterfall([

    		function(callback){		//Save in db
		    	dataset.save(function(err, res){
		    		callback(err, res);
		    	});
    		},
    		function(dataset, callback){

    			s3.putObject({

    				Bucket : dataset.s3Bucket,
    				Key : dataset.s3Key,
    				ACL : 'public-read', //TO-DO Change to private
    				Body : buffer

    			}, function(err, data) {

					if(err){
						//Rollback
						dataset.remove(function(){
							callback(err);
						});
						return;
					}

					console.log(data);

					callback(null, dataset);
				});
    		}

    	], function(err, dataset){

    		if(err){
    			return res.sendStatus(400);
    		}

    		res.redirect('/datasets');

    	});

    });

	req.pipe(req.busboy);

});

router.get('/', function(req, res){

    console.log(req.session);

    var filters = {};

    if(req.query.q) filters.$text = { $search : req.query.q };

	Dataset
	.find(filters)
	.or([{owner : username}, {public : true}])
    .exec(function(err, result){
        console.log(err);
		if(err){
			return res.sendStatus(500);
		}
		return res.render('datasets', {
            datasets : result
        });
	});

});

router.get('/:id', function(req, res){

    Dataset.findById(req.params.id, function(err, dataset){

        if(err){
            return res.sendStatus(500);
        }

        dataset = dataset.toJSON();
        var params = {
            Bucket : dataset.s3Bucket,
            Key : dataset.s3Key
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

router.delete('/:id', function (req, res) {

    Dataset.findById(req.params.id, function (err, dataset) {
        if(dataset.owner !== username) {
            res.sendStatus(401);
        } else {
            Dataset.findByIdAndRemove(req.params.id, function (err) {
                res.sendStatus(200);
            })
        }
    });
});


module.exports = router;
