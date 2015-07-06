// Modules
var express       = require('express');
var app           = express();
var bodyParser    = require('body-parser');
var cookieParser  = require('cookie-parser');
var session       = require('express-session')
var cas           = require('connect-cas');
var busboy 		  = require('connect-busboy');
var morgan		  = require('morgan');
var path		  = require('path');
var debug 		  = require('debug');
var ejs 		  = require('ejs');

//SET ENV VARIABLES
var env = (process.env.ENV ? process.env.ENV : 'development').toLowerCase(),
	secret = "ABCDE";

app.set('port', parseInt(process.env.PORT) || 8080);
app.set('env', env || 'development');
app.set('s3 datasets bucket', process.env.S3_DATASETS_BUCKET || 'datasets-test');
app.set('s3 jobs bucket', process.env.S3_JOBS_BUCKET || 'jobs-test');

// Use Jade to render templates
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
cas.configure({
	host : 'my107.iit.edu',
	path : '/cas/login'
});

app.use(cookieParser(secret));
app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: true
}));
//app.use(cas.serviceValidate());
//app.use(cas.authenticate());
app.use(morgan('dev'));
app.use(busboy());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));


var api = require('./routes/api');
var index = require('./routes/index.js');
var datasets = require('./routes/datasets.js');
var jobs = require('./routes/jobs.js');

app.use('/api', api);
app.use('/datasets', datasets);
app.use('/jobs', jobs);
app.use('/', index);

// start app ===============================================

var connections = require('./connections');

connections.on('connected', function(){
	console.log('connected');
	var server = app.listen(app.get('port'), function() {
	    console.log("Using " + app.get('env').toUpperCase() + " connection settings");
	    console.log("Listening on port " + server.address().port);
	});
});

module.exports = app;
