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
        unique: true,
        sparse: true
    },
    "referredBy": {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    "rewardPoints": {
        type: Number,
        default: 0
    },
    "googleId": {
        type: String,
        required: false
    }, 
    "level": {
        type: String,
        default: 'G1' // Default to the lowest level
    },
    "purchasedItems": [{
        itemId: { type: Schema.Types.ObjectId, ref: 'Item' },
        count: { type: Number, default: 1 }
    }],
    "emergencyContacts": [{
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        }
    }]
});
user.methods.updateUserLevel = async function() {
    const Level = mongoose.model('Level');
    const levels = await Level.find().sort({ pointsRequired: 1 });

    let newLevel = levels[0].levelName; // Default to the lowest level

    for (let i = 0; i < levels.length; i++) {
        if (this.rewardPoints <= levels[i].pointsRequired) {
            newLevel = levels[i].levelName;
            break;
        }
    }

    this.level = newLevel;
    // No save here, saving happens outside
};


// Middleware to automatically update the level when rewardPoints change
user.pre('save', async function(next) {
    if (this.isModified('rewardPoints')) {
        await this.updateUserLevel();
    }
    next();
});

module.exports = mongoose.model('User', user);
