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
    "image": {
        type: String,
    },
    "password": {
        type: String,
        required: true
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
    "CampsitesJoined": [{
        type: Schema.Types.ObjectId,
        ref: 'Campsite'
    }],
    "resetToken": {
        type: String
    },
    "subscriptionStatus": {
        type: String,
        default: 'No subscription'
    },
    "isPaid": {
        type: Boolean,
        default: false
    },
    "subscriptionId": {
        type: String
    },
    "planId": {
        type: String
    },
    "favourites": [{
        type: Schema.Types.ObjectId,
        ref: 'Campsite'
    }],
    "wishlist": [{
        type: Schema.Types.ObjectId,
        ref: 'Campsite'
    }],
    "referralCode": {
        type: String,
        unique: true, // Ensure that the referral code is unique across users
        sparse: true // This makes it possible to have multiple null values (for users without a code)
    },
    "referredBy": {
        type: Schema.Types.ObjectId,
        ref: 'User' // Reference to the user who referred this user
    },
    "rewardPoints": {
        type: Number,
        default: 0 // Default points are 0
    }
});

module.exports = mongoose.model('User', user);
