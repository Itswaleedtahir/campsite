const express = require("express");
const router = express.Router();
const camsitesController = require("../controllers/campsites");
const authPolicy = require("../utils/auth.policy");

router.post('/fileupload/s3', camsitesController.fileUploadS3);
router.post('/createCampsite', camsitesController.createCampsite);
router.get('/getAllCampsite', camsitesController.getAllCampSites);
router.get('/getTopRatedCampsites', camsitesController.getTopRatedCampsites);
router.post('/searchCampsite', camsitesController.searchCampsite);
router.post('/campsiteTypes', camsitesController.addCampsiteTypes);
router.get('/campsiteTypes', camsitesController.getCampsiteTypes);
router.post('/campingLocationTypes', camsitesController.addCampsiteLocationTypes);
router.get('/campingLocationTypes', camsitesController.getCampsiteLocationTypes);
router.post('/amenities', camsitesController.addAmenity);
router.get('/amenities', camsitesController.getAmenity);
router.post('/specialFeatures', camsitesController.addSpecialFeature);
router.get('/specialFeatures', camsitesController.getSpecialFeatures);
router.get('/getAllDataForFilters', camsitesController.getAllDataForFilters);
router.post('/getNearByCamsites', camsitesController.getNearByCamsites);
router.post('/getRecommendCampsites',authPolicy ,camsitesController.getRecommendCampsites);
router.put('/campsites/:id', camsitesController.updateCampsite);
router.get('/getSingleCampsite/:id', camsitesController.getSingleCampSite);
router.post('/updateAmenity/:id', camsitesController.updateAmenity);
router.post('/updateCampsiteLocationType/:id', camsitesController.updateCampsiteLocationType);
router.delete('/deleteAmenity/:id', camsitesController.deleteAmenity);
router.post('/updateSpecialFeature/:id', camsitesController.updateSpecialFeature);
router.delete('/deleteSpecialFeature/:id', camsitesController.deleteSpecialFeature);
module.exports = router;