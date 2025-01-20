const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const authPolicy = require("../utils/auth.policy");
router.post('/createCommunity',authPolicy,communityController.createCommunity);
router.get('/getAllCommunities',communityController.getAllCommunities)
router.put('/followCommunity/:communityId',authPolicy,communityController.followCommunity)
router.delete('/unfollowCommunity/:communityId',authPolicy,communityController.unfollowCommunity)
router.get('/userfollowedCommunity/:userId',authPolicy,communityController.getUserFollowedCommunity)
module.exports = router;