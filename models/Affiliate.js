var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var affiliate = new Schema({
    "followers": {
        type: String
    },
    "platform": {
        type: String,
    },
    "link": [{
        type: String,
    }],
    "promoCode": {
        type: String
    },
    "status": {
        type: String,
        enum: ["Approved", "Rejected","Pending"],
        default:"Pending"
    },
    "userId": {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
    "userInvited":{
        type: Number
    },
    "percentage":{
        type: Number
    },
    "commission":{
        type: Number
    }
    
});
module.exports = mongoose.model('Affiliate', affiliate);
