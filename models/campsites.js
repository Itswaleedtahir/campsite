const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const campsiteSchema = new Schema({
  "name": {
    type: String,
    required: true
  },
  "campsiteType":{
    type: String,
    require:false
  },
  "campingLocationType":{
    type:String
  },
  "country": {
    type: String,
    required: true
  },
  "about": {
    type: String,
    required: true
  },
  "phoneNo": {
    type: String,
    required: true
  },
  "email": {
    type: String,
    required: true
  },
  "location": { // Changed "Location" to "location" for consistency and updated structure
    latitude: {
      type: Number,
      required: false
    },
    longitude: {
      type: Number,
      required: false
    }
  },
  "website": {
    type: String,
    required: false
  },
  "amenities": [{
    type: String
  }],
  "specialFeatures": [{
    type: String
  }],
  "rulesAndRegulations": [{
    type: String
  }],
  "peopleJoined": [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  "price": {
    type: Number,
    required: true
  },
  "images": [{
    type: String
  }],
  "reviewStats": {
    "averageRating": {
      type: Number,
      default: 0
    },
    "totalReviews": {
      type: Number,
      default: 0
    }
  }
});

const Campsite = mongoose.model('Campsite', campsiteSchema);

module.exports = Campsite;
