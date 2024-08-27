const express = require("express");
const router = express.Router();
const camsitesController = require("../controllers/campsites");

router.post('/fileupload/s3', camsitesController.fileUploadS3);
router.post('/createCampsite', camsitesController.createCampsite);
router.get('/getAllCampsite', camsitesController.getAllCampSites);
router.post('/searchCampsite', camsitesController.searchCampsite);
router.post('/campsiteTypes', camsitesController.addCampsiteTypes);
router.get('/campsiteTypes', camsitesController.getCampsiteTypes);
router.post('/campingLocationTypes', camsitesController.addCampsiteLocationTypes);
router.get('/campingLocationTypes', camsitesController.getCampsiteLocationTypes);
router.post('/amenities', camsitesController.addAmenity);
router.get('/amenities', camsitesController.getAmenity);
router.post('/specialFeatures', camsitesController.addSpecialFeature);
router.get('/specialFeatures', camsitesController.getSpecialFeatures);
router.put('/campsites/:id', camsitesController.updateCampsite);
router.get('/getSingleCampsite/:id', camsitesController.getSingleCampSite);
module.exports = router;