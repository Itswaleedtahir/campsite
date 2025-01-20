var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var communities = new Schema({
    "name": {
        type: String,
        required: false
    },
    "image":{
        type:String,
    },
    "followers":  [{
        type: mongoose.Schema.Types.ObjectId, // Use MongoDB ObjectId to reference users
        ref: 'User'  // Optional: only if you have a User model and want to create relationships
      }]
});

module.exports = mongoose.model('communities', communities);
