const express = require("express");
const router = express.Router();
const planController = require("../controllers/subscriptionCreate");
const authPolicy = require("../utils/auth.policy");

router.post('/createPlan',planController.createModel)
router.post('/createSubscription',authPolicy,planController.getSubscriptionForUserFunction)
router.post('/cancelSubscription',authPolicy,planController.cancelSubscription)
router.get('/getPlan',planController.getPlan)
router.post('/campsiteBooking',authPolicy,planController.securePayment2)
router.post('/updateBookingStatus',authPolicy,planController.updateBookingStatus)
router.get('/getCompletedBookingsForUser',authPolicy,planController.getCompletedBookingsForUser)
router.post('/refundCampsiteBooking',authPolicy,planController.refundCampsiteBooking)
router.post('/getRefundStatus',authPolicy,planController.getRefundStatus)
router.post("/webhookforBooking",planController.stripetesting)
router.post('/bookCampsite/:campsiteId',authPolicy,planController.securePayment2)
router.post('/updatePlan/:id',planController.updatePlan)
module.exports = router;