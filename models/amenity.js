// models/Amenity.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const amenitySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true // Ensure no duplicate amenities
  },
  image:{
    type : String
  }
});

const Amenity = mongoose.model('Amenity', amenitySchema);
module.exports = Amenity;
