const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Review schema
const reviewSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,  // Assuming ratings are from 1 to 5
    max: 5
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campsiteId: {
    type: Schema.Types.ObjectId,
    ref: 'Campsite',
    required: true
  },
  images: {
    type: String // URL or path to the image file
  },
  videos: {
    type: String // URL or path to the video file
  },
  likes:[{
        type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // New field
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
