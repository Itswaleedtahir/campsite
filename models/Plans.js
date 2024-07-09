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
});

module.exports = mongoose.model('plan', plan);
