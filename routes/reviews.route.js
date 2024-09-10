const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviews");
const authPolicy = require("../utils/auth.policy");

router.post("/addReview",authPolicy,reviewController.addReview)
router.post("/likeReview/:id",authPolicy,reviewController.likeReview)
router.post("/replyReview/:id",authPolicy,reviewController.replyReview)
router.get("/replyReview/:id",authPolicy,reviewController.getReviewReply)
router.get("/getreviewsforcampsite/:campsiteId",reviewController.getReviewsForSingleCampsites)

module.exports = router;