// models/CampsiteType.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campsiteTypeSchema = new Schema({
  type: {
    type: String,
    required: true,
    unique: true // Ensure no duplicate campsite types
  }
});

const CampsiteType = mongoose.model('CampsiteType', campsiteTypeSchema);
module.exports = CampsiteType;
