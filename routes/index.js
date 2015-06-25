var express = require('express');
var multer  = require('multer');
var moment  = require('moment');
var crypto  = require('crypto');
var Knox    = require('knox');
var promise = require('bluebird');
var gm      = require('gm').subClass({imageMagick: true});


var router = express.Router();
var config = require('../config/' + process.env.NODE_ENV);

// Create the knox client with your aws settings
Knox.aws = Knox.createClient({
  key    : config.aws.AWS_ACCESS_KEY_ID,
  secret : config.aws.AWS_SECRET_ACCESS_KEY,
  bucket : config.aws.S3_BUCKET_NAME,
  region : 'ap-southeast-1', // asian
  // region : 'eu-west-1'   // US
});

router.use(multer({ // https://github.com/expressjs/multer
  dest: './public/uploads/', 
  rename: function (fieldname, filename) {
    var datePrefix = moment().format('YYYY[/]MM');
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

router.post('/', function(req, res, next) {

  if(req.files !== undefined && req.files.image) {
    var images = req.files.image;
    

    function resizeAndPostS3(img) {
      return new Promise(function(resolve, reject) {
        gm(img.buffer)
          .size(function(err, size) {
            var width = size.width;
            var height = size.height;
            var totalpixel = width * height;

            if(width > 960 || height > 640) {
              this.resize(960, 640);
            }

            if(img.buffer.length > 20971520 ) {
              reject('err size');
            }

            console.log(img.size, (totalpixel) * 0.16)

            if(img.size >= (totalpixel) * 0.16) {
              var encodeHQ = (1 - (totalpixel * 0.16) / img.size) * 100;
              this.quality(encodeHQ);
              console.log('encodeHQ');
            }

            // this.write('./out/' + img.name, function (err) {  // save file localhost
            //   if (!err) resolve({status: 'done'});
            //   reject(err);
            // });


            this.toBuffer(function(err, buffer) {
              if(err) reject('err image');

                var pathToArtwork = '/artworks/' + img.name;

                var headers = {
                  'Content-Length': buffer.length,
                  'Content-Type': img.mimetype,
                  'x-amz-acl': 'public-read'
                };

                Knox.aws.putBuffer( buffer, pathToArtwork, headers, function(err, response) {
                  if (err) {
                    console.error('error streaming image: ', new Date(), err);
                    reject(err)
                  }
                  if (response.statusCode !== 200) {
                    console.error('error streaming image: ', new Date());
                    var error = new Error('error streaming image');
                    reject(error);
                  }
                  // console.log(response);
                  console.log('Amazon response statusCode: ', response.statusCode);
                  console.log('Your file was uploaded');
                  resolve(response.req.url);
                });
            });
          });
      });
    }


    if(Array.isArray(images)) {
      promise.map(images, function(img) {
        return resizeAndPostS3(img).then(function(result) {
          return result;
        }).catch(function(err) {
          return err;
        });
      }).then(function(result) {
        res.send(result);
      }).catch(function(err) {
        next(err);
      });
    } else {
      resizeAndPostS3(images).then(function(result) {
        res.send(result);
      }).catch(function(err) {
        next(err);
      })
    }
  } else {
    var err = new Error('null file');
    next(err);
  }
});

module.exports = router;