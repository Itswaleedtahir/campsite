const Bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
let secret = "devgate9999";
// const fs = require('fs');
const formidable = require("formidable");
let methods = {
  hashPassword: (password) => {
    return new Promise((resolve, reject) => {
      Bcrypt.hash(password, 10, (err, passwordHash) => {
        if (err) {
          reject(err);
        } else {
          resolve(passwordHash);
        }
      });
    });
  },
  comparePassword: (pw, hash) => {
    return new Promise((resolve, reject) => {
      Bcrypt.compare(pw, hash, function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    });
  },
  issueToken: (payload) => {
    return new Promise((resolve, reject) => {
      jwt.sign(payload, secret, { expiresIn: "7d" }, (err, accessToken) => {
        // Change expiresIn to "7d"
        if (err) {
          reject(err);
        } else {
          jwt.sign(payload, secret, { expiresIn: "7d" }, (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({ accessToken });
            }
          });
        }
      });
    });
  },
  verifyToken: (token, cb) => jwt.verify(token, secret, {}, cb),
  attachBodyAndFiles: (req, res, next) => {
    console.log("Attach File Function Called");
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      if (err) {
        return res.status(500).json({
          success: false,
          msg: "General Middleware File Handling Error",
          err,
        });
      }
      req.files = [];
      for (const key in files) {
        //eslint-disable-next-line
        if (files.hasOwnProperty(key)) {
          const element = files[key];
          req.files.push(element);
        }
      }
      req.body = fields;
      next();
    });
  },
  uploadFileto3: (file) => {
    var ext = file.mimetype.split("/").pop();
    return new Promise(function (resolve, reject) {
      var stream;
      if (file.path) {
        stream = fs.createReadStream(file.path);
      }
      if (file.filepath) {
        stream = fs.createReadStream(file.filepath);
      } else {
        stream = file.data;
      }
      // if (!name) {
      let name = Date.now().toString() + "." + ext;
      // }
      var data = {
        Key: name,
        ACL: "public-read",
        Body: stream,
        ContentType: file.mimetype,
        Bucket: BUCKET_NAME,
      };
      s3.upload(data, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },
};
module.exports = methods;







