var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var plan = new Schema({
    "priceId": {
        type: String,
        required: false
    },
    "title": {
        type: String,
        required: true  // Assuming the title is a required field
    },
    "subTitle": {
        type: String,
        required: true  // Assuming the title is a required field
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
    },
    "description":{
        type:String,
        }
});

module.exports = mongoose.model('plan', plan);
