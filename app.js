var express     = require('express');
var http     = require('http');
var multer  = require('multer');
var crypto  = require('crypto');

var app = express();

var upload = require('./routes/upload.js');


// all environments
app.set('port', process.env.PORT || 3000);
app.use(multer({ // https://github.com/expressjs/multer
  dest: './public/uploads/', 
  rename: function (fieldname, filename) {
    var key = crypto.randomBytes(10).toString('hex');
    return key + '-' + filename.replace(/\W+/g, '-').toLowerCase();
  },
  onFileUploadStart: function(file) {
    console.log('Starting file upload process.');
    if(! /\/(png|gif|jpg|jpeg|pjpeg)$/i.test(file.mimetype)) {
      return false;
    }
  },
  onParseEnd: function(req, next) {
    console.log('Done parsing!');
    next();
  },
  onError: function(err, next) {
    next(err);
  },
  inMemory: true //This is important. It's what populates the buffer.
}))

app.use('/upload', upload);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        message: err.message,
        error: {}
    });
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
