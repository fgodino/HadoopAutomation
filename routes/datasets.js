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

    		res.send(dataset.toJSON());

    	});

    });

	req.pipe(req.busboy);

});

router.get('/', function(req, res){

	Dataset
		.find()
		.or([{owner : username}, {public : true}])
		.exec(function(err, result){
			if(err){
				return res.sendStatus(500);	
			}
			return res.send(result);
		});
		
});

router.get('/:id', function(req, res){

    Dataset.findById(req.params.id, function(err, dataset){
        
        if(err){
            return res.sendStatus(500);
        }

        dataset = dataset.toJSON();

        s3.getObject({
            Bucket : dataset.s3Bucket,
            Key : dataset.s3Key
        }, function(err, data) {
            if(err) return res.sendStatus(500);

            try {
                dataset.body = data.Body.toString();
                res.send(dataset);
            } catch(err){
                console.log(err);
                res.sendStatus(500);
            }
        });
    });
        
});


module.exports = router;