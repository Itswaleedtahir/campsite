const express = require("express");
const router = express.Router();
const planController = require("../controllers/subscriptionCreate");
const authPolicy = require("../utils/auth.policy");

router.post('/createPlan',planController.createModel)
router.post('/createSubscription',planController.getSubscriptionForUserFunction)
router.get('/getPlan',planController.getPlan)
router.post('/campsiteBooking',planController.securePayment2)
router.post("/webhookforBooking",planController.stripetesting)
router.post('/bookCampsite/:campsiteId',authPolicy,planController.securePayment2)
module.exports = router;