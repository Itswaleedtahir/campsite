const express = require("express");
const router = express.Router();
const authPolicy = require("../utils/auth.policy");
const itemController = require("../controllers/rewardItemController")

router.post("/createItem",itemController.createItem )
router.post("/buyItem",authPolicy,itemController.buyItems )
router.get("/getItem",itemController.getItems )
router.delete("/deleteItem/:id",itemController.deleteItems)
router.post("/updateItem/:id",itemController.updateItem)

module.exports = router;