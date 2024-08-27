// models/SpecialFeature.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const specialFeatureSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true // Ensure no duplicate special features
  },
  image:{
    type:String
  }
});

const SpecialFeature = mongoose.model('SpecialFeature', specialFeatureSchema);
module.exports = SpecialFeature;
