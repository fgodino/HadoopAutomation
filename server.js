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

var port = process.env.PORT || 8080;
var secret = "ABCDE";

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
app.use(cas.serviceValidate());
app.use(cas.authenticate());
app.use(morgan('dev'));
app.use(busboy());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

var api = require('./app/routes/api');
var index = require('./app/routes/index.js');

app.use('/api', api);
app.get('/', index);

// start app ===============================================
app.listen(port);	
console.log('listening on port ' + port);
module.exports = app;