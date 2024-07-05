const router = require("express").Router();
const userRoutes = require("./user.route");
const communityRoute = require("./community.route")
router.use("/user", userRoutes);
router.use("/community", communityRoute);
module.exports = router;