const router = require("express").Router();
const userRoutes = require("./user.route");
const communityRoute = require("./community.route")
const planSubscription = require("./plan.route")
const campsitesRoutes = require("./campsites.route")
const rewardItems = require("./rewardItems.route")
const reviewRoutes = require("./reviews.route")
const levelRoutes = require("./levels.route")
const express = require('express')
router.use("/user", userRoutes);
router.use("/community", communityRoute);
router.use("/subscription",planSubscription)
router.use("/campsites",campsitesRoutes)
router.use("/review",reviewRoutes)
router.use("/items",rewardItems)
router.use("/levels",levelRoutes)
module.exports = router;