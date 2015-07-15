// Modules
var express       = require('express');
var app           = express();
var bodyParser    = require('body-parser');
var cookieParser  = require('cookie-parser');
var session       = require('express-session')
var RedisStore    = require('connect-redis')(session);
var busboy 		  = require('connect-busboy');
var morgan		  = require('morgan');
var path		  = require('path');
var debug 		  = require('debug');
var https		  = require('https');
var http          = require('http');
var fs            = require('fs');
var cas_validate  = require('cas_validate');


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

// Serve a couple of static dirs
app.use(express.static(__dirname + '/public'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

app.use(function (req, res, next){
  if(req.secure){
    return next();
  };
  res.redirect('https://'+req.host+req.url);
});

var cas_config = {
	'cas_host' : 'my107.iit.edu',
	'service' : 'https://64.131.111.55'
};

app.use(cookieParser(secret));
app.use(session({
  store: new RedisStore({}),
  secret: secret,
  resave: false,
  saveUninitialized: true
}));
app.use(cas_validate.ticket(cas_config));
app.use(cas_validate.check_and_return(cas_config));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(busboy());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

var index = require('./routes/index.js');
var datasets = require('./routes/datasets.js');
var jobs = require('./routes/jobs.js');
var processes = require('./routes/processes.js');

app.use('/logout', cas_validate.logout(cas_config));
app.use('/datasets', datasets);
app.use('/jobs', jobs);
app.use('/processes', processes);
app.use('/', index);

// start app ===============================================

var connections = require('./connections');
var pubSub = require('./pubSub.js')

var httpsOptions = {
	key : fs.readFileSync('./keys/hadoopAutomation-key.pem'),
	cert : fs.readFileSync('./keys/hadoopAutomation-cert.pem')
}

connections.on('connected', function(){
    http.createServer(app).listen(80);
	https.createServer(httpsOptions, app).listen(app.get('port'), function() {
	    console.log("Using " + app.get('env').toUpperCase() + " connection settings");
	    console.log("Listening on port " + app.get('port'));
      pubSub.start();
	});
});

module.exports = app;
