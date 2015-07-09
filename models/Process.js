var mongoose = require('mongoose'),
	connections = require('../connections'),
    async = require('async'),
	ValidationError = mongoose.Error.ValidationError,
    ValidatorError = mongoose.Error.ValidatorError;

var Dataset = require('./Dataset.js'),
    Job = require('./Job.js');

var states = [
    'WAITING',
    'PROCESSING',
    'PROCESSED',
    'FAILED'
];

var processSchema = mongoose.Schema({
    owner : { type : String, required : true },
    name : { type : String, required : true },
    states : { type : String, enum : states, default : states[0] },
    dataset: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset' },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    nodes : { type : Number, default : 1 }
});

processSchema.pre('save', function (next) {
	
    var self = this;
    self.createdAt = Date.now();

    async.parallel([

        function(callback){
            Dataset.findById(self.dataset, function(err, doc){    
                if(err){
                    return callback(err);
                }
                if(doc.public || doc.owner === owner){
                    return callback();
                }
                return callback('You do not have permissions to create this process');
            });
        },
        function(callback){
            Job.findById(self.job, function(err, doc){    
                if(err){
                    return callback(err);
                }
                if(doc.public || doc.owner === owner){
                    return callback();
                }
                return callback('You do not have permissions to create this process');
            });
        }], function(err){
            next(err);
        });
});

module.exports = connections.db.model('Process', processSchema);
