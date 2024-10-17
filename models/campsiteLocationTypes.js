// models/CampingLocationType.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campingLocationTypeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true // Ensure no duplicate location types
  },
  image:{
    type:String
  }
});

const CampingLocationType = mongoose.model('CampingLocationType', campingLocationTypeSchema);
module.exports = CampingLocationType;
