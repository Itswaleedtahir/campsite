const express = require("express");
const router = express.Router();
const planController = require("../controllers/subscriptionCreate");
const authPolicy = require("../utils/auth.policy");
const bodyParser = require('body-parser');
const app = express();

router.post('/createPlan',planController.createModel)
router.post('/createSubscription',planController.getSubscriptionForUserFunction)
module.exports = router;