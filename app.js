var express = require('express');
var http = require('http');
var multer = require('multer');
var crypto = require('crypto');
var IMGR = require('imgr').IMGR;
var upload = require('./routes/upload.js');
var app = express();
var imgr = new IMGR();
const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;


imgr.serve('./public/uploads')
    .namespace('/images')
    .urlRewrite('/:path/:file-:size.:ext')
    .whitelist([ '200x300', '100x100' ])
    .using(app);
/**
 * Example: http://localhost:3000/images/2015/11/22/126a1fe2930c6b6db1e048a60dab499cee6d0483-200x300.jpg
 */


app.use(multer({ // https://github.com/expressjs/multer
  dest: './public/uploads/',
  rename: function (fieldname, filename) {
    /**
     * var key = crypto.randomBytes(10).toString('hex');
     * return key + '-' + filename.replace(/\W+/g, '-').toLowerCase();
     */
    return crypto.randomBytes(20).toString('hex');
  },
  onFileUploadStart: function(file) {
    if(! /\/(png|gif|jpg|jpeg|pjpeg)$/i.test(file.mimetype)) {
      return false;
    }
  },
  onError: function(err, next) {
    next(err);
  },
  inMemory: true //This is important. It's what populates the buffer.
}))

app.use('/upload', upload);

app.use(function(req, res, next) {
  var err = new Error('Not Found!');
  err.status = 404;
  next(err);
})

app.use(function(err, req, res, next) {
  var status = err.status || 500;
  res.status(status);
  if(env === "development") {
    res.json({
      message: err.message,
      status: status
    });
    return;
  }
  err.status ?
	  res.send(err.message) :
	  res.send('Internal server error');
})

http.createServer(app).listen(port, function(){
  console.log('Express server listening on port ' + port);
});
