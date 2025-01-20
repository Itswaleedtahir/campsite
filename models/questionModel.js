const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Review schema
const questions = new Schema({
  question: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Questoin = mongoose.model('Question', questions);

module.exports = Questoin;
