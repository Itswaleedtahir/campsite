const Bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
let secret = "devgate9999";
const AWS = require("aws-sdk")
// const fs = require('fs');
const formidable = require("formidable");
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3({
  apiVersion: "2006-03-01", // Optional, use the latest API version
  region: process.env.AWS_REGION, // Ensure the region is explicitly passed
});
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
  uploadFile: async (file, access) => {
    file.name = file.name.replace(/\s/g, "").replace("#", "").replace('"', "");
    let fileName = file.name;
    const fileExtension = file.name.substring(file.name.lastIndexOf("."));
    const fileNameWithoutExtension = `fileupload/${Date.now()}/${file.name.substring(
      0,
      file.name.lastIndexOf(".")
    )}`;
    fileName = `${fileNameWithoutExtension}${fileExtension}`;
    const uploadParams = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileName,
      ContentDisposition: "inline",
      ContentType: file.mimetype,
      Body: file.data,
      ACL: access === "Public" ? "public-read" : undefined, // Make the file public if access is "Public"
    };
    try {
      const data = await s3.upload(uploadParams).promise();
      console.log("File uploaded successfully: ", data);
      return data;
    } catch (error) {
      console.error("Error uploading file: ", error);
      throw new Error("File upload failed");
    }
  },
};
module.exports = methods;







