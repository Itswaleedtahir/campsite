const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviews");
const authPolicy = require("../utils/auth.policy");

router.post("/addReview",authPolicy,reviewController.addReview)
router.get("/getPendingReviews",authPolicy,reviewController.getPendingReviews)
router.get("/getApprovedReviews",authPolicy,reviewController.getApprovedReviews)
router.post("/approveReview/:id",authPolicy,reviewController.approveReview)
router.post("/rejectReview/:id",authPolicy,reviewController.rejectReview)
router.post("/deleteReview/:id",authPolicy,reviewController.deleteReview)
router.post("/likeReview/:id",authPolicy,reviewController.likeReview)
router.post("/unlikeReview/:id",authPolicy,reviewController.unlikeReview)
router.post("/replyReview/:id",authPolicy,reviewController.replyReview)
router.get("/replyReview/:id",authPolicy,reviewController.getReviewReply)
router.get("/getreviewsforcampsite/:campsiteId",reviewController.getReviewsForSingleCampsites)

module.exports = router;