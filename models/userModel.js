var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var user = new Schema({
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
    "image":{
        type:String,
    },
    "password": {
        type: String,
        required: true
    },
    "profilepic": {
        type: String
    },
    "otp":{
        type:String
    },
    "isVerified":{
        type:Boolean,
        default:false
    },
    "CampsitesJoined": [{
        type: Schema.Types.ObjectId,
        ref: 'Campsite'
      }],
    "resetToken":{
        type:String
    },
    "subscriptionStatus":{
        type:String,
        default:'No subscription'
    },
    "isPaid":{
        type:String,
        default:false
    },
    "subscriptionId":{
        type:String,
        default:false
    },
    "planId":{
        type:String
    }
});

module.exports = mongoose.model('User', user);
