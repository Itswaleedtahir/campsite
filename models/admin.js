var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var admin = new Schema({
    "firstname": {
        type: String,
        required: false
    },
    "lastname": {
        type: String,
        required: false
    },
    "email": {
        type: String,
        required: true
    },
    "image": {
        type: String,
    },
    "password": {
        type: String,
        required: false
    },
    "profilepic": {
        type: String
    },
    "otp": {
        type: String
    },
    "isVerified": {
        type: Boolean,
        default: false
    },
    "resetToken": {
        type: String
    },
    "role": { // Role to differentiate super admin and regular admins
        type: String,
        enum: ['super_admin', 'admin'],
        default: 'admin'
    }
});

module.exports = mongoose.model('Admin', admin);
