const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviews");
const authPolicy = require("../utils/auth.policy");

router.post("/addReview",authPolicy,reviewController.addReview)
router.get("/getreviewsforcampsite/:campsiteId",reviewController.getReviewsForSingleCampsites)

module.exports = router;