var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var blog = new Schema({
    "title": {
        type: String,
        required: false
    },
    "blogText": {
        type: String,
        required: false
    },
    "toDisplay":{
        type:Boolean,
        default:false
    }
});

module.exports = mongoose.model('blogs', blog);
