const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Payment schema
const PaymentSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',  // Assuming you have a User model to reference
        required: true
    },
    campsiteId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Campsite',  // Assuming you have a Campsite model to reference
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'USD'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    noOfDays: {
        type: Number,
        required: true
    },
    noOfPersons: {
        type: Number,
        required: true
    },
    pricePerDay: {
        type: Number,
        required: true
    },
    paymentIntentId: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Export the model
module.exports = mongoose.model('Booking', PaymentSchema);
