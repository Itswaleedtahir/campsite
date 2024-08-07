var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var rewardItems = new Schema({
    "name": {
        type: String,
        required: false
    },
    "image": {
        type: String,
        required: false
    },
    "prize":{
        type:String,
        required:false
    }
});

module.exports = mongoose.model('rewardItems', rewardItems);
