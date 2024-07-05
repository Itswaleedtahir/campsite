const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const authPolicy = require("../utils/auth.policy");
router.post('/createCommunity',communityController.createCommunity);
router.get('/getAllCommunities',communityController.getAllCommunities)
router.put('/followCommunity/:communityId',authPolicy,communityController.followCommunity)
router.get('/userfollowedCommunity/:userId',authPolicy,communityController.getUserFollowedCommunity)
module.exports = router;