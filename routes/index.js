const router = require("express").Router();
const userRoutes = require("./user.route");
const communityRoute = require("./community.route")
const planSubscription = require("./plan.route")
const express = require('express')
router.use("/user", userRoutes);
router.use("/community", communityRoute);
router.use("/subscription",planSubscription)
module.exports = router;