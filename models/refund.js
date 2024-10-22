const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Payment schema
const PaymentSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',  // Assuming you have a User model to reference
        required: true
    },
    refundId:{
        type: String,
    },
    amount:{
        type: String,
    },
    balanceTranctionId:{
        type: String,
    },
    chargeId:{
        type: String,
    },
    destinationDetails:{
        type:JSON
    },
    paymentIntendId:{
        type: String,
    },
    status: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Export the model
module.exports = mongoose.model('Refund', PaymentSchema);
