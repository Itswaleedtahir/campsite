const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const replySchema = new Schema({
  text: {
    type: String,
    required: true
  },
  reviewId: {
    type: Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Reply = mongoose.model('Reply', replySchema);
module.exports = Reply;
