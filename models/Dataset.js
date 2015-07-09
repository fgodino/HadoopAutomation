var mongoose = require('mongoose'),
	connections = require('../connections'),
	ValidationError = mongoose.Error.ValidationError,
    ValidatorError = mongoose.Error.ValidatorError;

var datasetSchema = mongoose.Schema({
    owner : { type : String, required : true },
    name : { type : String, required : true },
    public : { type : Boolean, default : false },
    s3Bucket : String,
    s3Key : String
});


datasetSchema.pre('save', function (next) {
    this.createdAt = Date.now();
    next();
});

datasetSchema.index({owner: 1, name: 1}, {unique: true});
datasetSchema.index({
    owner : 'text',
    name : 'text'
});

module.exports = connections.db.model('Dataset', datasetSchema);

