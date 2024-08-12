var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var levelSchema = new Schema({
    levelName: {
        type: String,
        required: true,
        unique: true
    },
    pointsRequired: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Level', levelSchema);