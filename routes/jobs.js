//Modules
var express = require('express');
var router = express.Router();
var Job = require('../models/Job');
var async = require('async');
var sanitize = require("sanitize-filename");

var s3 = require('../connections').s3;

var username = "fgodino";

router.post('/', function(req, res){

	var data = {}, buffer;

    req.busboy.once('file', function(fieldname, file, filename) {

        var bufs = [];
        data.filename = filename;

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

    	var job = new Job({
    		name : data.name,
    		owner : username,
    		public : data.public || false,
    		s3Bucket : req.app.get('s3 jobs bucket'),
    		s3Key : username + '/' + sanitize(data.name)
    	});

    	async.waterfall([

    		function(callback){		//Save in db
		    	job.save(function(err, res){
		    		callback(err, res);
		    	});
    		},
    		function(job, callback){

    			s3.putObject({

    				Bucket : job.s3Bucket,
    				Key : job.s3Key,
    				ACL : 'public-read', //TO-DO Change to private
    				Body : buffer,
    				Metadata : {
    					filename : data.filename
    				}
    			}, function(err, data) {

					if(err){
						//Rollback
						job.remove(function(){
							callback(err);
						});
						return;
					}

					callback(null, job);
				});
    		}

    	], function(err, job){

    		if(err){
    			return res.sendStatus(400);
    		}

    		res.send(job.toJSON());

    	});

    });

	req.pipe(req.busboy);

});

router.get('/', function(req, res){

	Job
		.find()
		.or([{owner : username}, {public : true}])
		.exec(function(err, result){
			if(err){
				return res.sendStatus(500);
			}
			return res.render('jobs', {
                jobs: result
            });
		});

});

router.get('/:id', function(req, res){

    Job.findById(req.params.id, function(err, job){

        if(err){
            return res.sendStatus(500);
        }

        job = job.toJSON();
        var params = {
            Bucket : job.s3Bucket,
            Key : job.s3Key
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


module.exports = router;
