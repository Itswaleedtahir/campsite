const express = require("express");
const router = express.Router();
const authPolicy = require("../utils/auth.policy");
const questionController = require("../controllers/quesitonController")

router.post("/createQuestion",questionController.addQuestion)
router.get("/getQuestions",questionController.getQuestions )
router.delete("/deleteQuestion/:id",questionController.deleteQuestion)
// router.post("/updateItem/:id",itemController.updateItem)

module.exports = router;