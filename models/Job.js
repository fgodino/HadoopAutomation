var mongoose = require('mongoose'),
	connections = require('../connections'),
	ValidationError = mongoose.Error.ValidationError,
    ValidatorError = mongoose.Error.ValidatorError;

var jobSchema = mongoose.Schema({
    owner : { type : String, required : true },
    name : { type : String, required : true },
    public : { type : Boolean, default : false },
    s3Bucket : String,
    s3Key : String
});

jobSchema.index({owner: 1, name: 1}, {unique: true});

jobSchema.pre('save', function (next) {
	this.createdAt = Date.now();
	next();
});

module.exports = connections.db.model('Job', jobSchema);

