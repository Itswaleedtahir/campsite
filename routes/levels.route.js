const express = require("express");
const router = express.Router();
const levelController = require("../controllers/levels");

router.post("/addLevel",levelController.addLevel)
router.get("/getLevels",levelController.getLevels)
router.post("/updateLevel/:id",levelController.updateLevel)
router.post("/deleteLevel/:id",levelController.deleteLevel)

module.exports = router;