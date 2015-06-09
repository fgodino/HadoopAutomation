//Modules
var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.sendfile(path.join(__dirname, 'views/index.html'));


});

router.get('/downloadfile', function(req, res){

});

router.get('/logout', function(req, res){
  res.redirect('https://mydev107.iit.edu/cas/logout');
});

router.post('/uploadfile', function(req, res){

  req.busboy.once('file', function(fieldname, file, filename, encoding, mimetype) {

    //TODO Upload to S3

  });

  busboy.on('finish', function() {
    res.writeHead(200, { Connection: 'close', Location: '/' });
    res.end();
  });

  req.pipe(req.busboy);

});

router.post('/submitjob', function(req, res){

});

router.post('/deletejob', function(req, res){

});


module.exports = router;