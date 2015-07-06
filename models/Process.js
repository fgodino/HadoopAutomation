var mongoose = require('mongoose'),
	connections = require('../connections'),
	ValidationError = mongoose.Error.ValidationError,
    ValidatorError = mongoose.Error.ValidatorError;

var states = [
    'WAITING',
    'PROCESSING',
    'PROCESSED',
    'FAILED'
];

var processSchema = mongoose.Schema({
    owner : { type : String, required : true },
    name : { type : String, required : true },
    states : { type : String, enum : states, default : states[0] }
});

processSchema.pre('save', function (next) {
	this.createdAt = Date.now();
	next();
});

module.exports = connections.db.model('Process', processSchema);
