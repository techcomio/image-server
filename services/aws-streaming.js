// Initialize aws client
// =====================
var config = require('../config/' + process.env.NODE_ENV);
var Knox = require('knox');
var moment = require('moment');
var crypto = require('crypto');
var gm = require('gm').subClass({imageMagick: true});
var Promise = require('bluebird');
var Busboy = require('busboy');

// Create the knox client with your aws settings
Knox.aws = Knox.createClient({
  key: config.aws.AWS_ACCESS_KEY_ID,
  secret: config.aws.AWS_SECRET_ACCESS_KEY,
  bucket: config.aws.S3_BUCKET_NAME,
  // region: 'eu-west-1'
  region: 'ap-southeast-1'
});

// S3 upload service - stream buffers to S3
// ========================================
var s3UploadService = function(req, cb) {
    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
      console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
      file.on('data', function(data) {
        console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
      });
      file.on('end', function() {
        console.log('File [' + fieldname + '] Finished');
        
      });
    });
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
      console.log('Field [' + fieldname + ']: value: ' + inspect(val));
    });
    busboy.on('finish', function() {
      console.log('Done parsing form!');
      cb();
    });
    req.pipe(busboy);
};

module.exports = s3UploadService;
