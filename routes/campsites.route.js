const express = require("express");
const router = express.Router();
const camsitesController = require("../controllers/campsites");

router.post('/fileupload/s3', camsitesController.fileUploadS3);
router.post('/createCampsite', camsitesController.createCampsite);
router.get('/getAllCampsite', camsitesController.getAllCampSites);
router.post('/searchCampsite', camsitesController.searchCampsite);
router.get('/getSingleCampsite/:id', camsitesController.getSingleCampSite);
module.exports = router;