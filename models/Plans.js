var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var plan = new Schema({
    "priceId": {
        type: String,
        required: false
    },
    "planName": {
        type: String,
        required: false
    },
    "price":{
        type: String
    },
    "duration":{
        type:String
    },
    "features":{
        type:[String]
    }
});

module.exports = mongoose.model('plan', plan);
