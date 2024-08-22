const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authPolicy = require("../utils/auth.policy");
router.post(`/user-signup`, userController.addUser);
router.post(`/user-verification`, userController.verifyUser);
router.post(`/resendOtp`, userController.resendOTP);
router.get(`/view-user`, userController.viewUser);
router.put(`/update-user`, userController.updateUser);
router.post(`/login`, userController.loginUser);
router.post(`/googleVerify`, userController.googleVerify);
router.post(`/referralCheck`,authPolicy ,userController.referralCheck);
router.post(`/forgot-password`, userController.forgotPassword);
router.post(`/reset-password`, userController.resetPassword);
router.post(`/change-password`, authPolicy, userController.changePassword);
router.get(`/getUserDetails`, authPolicy, userController.getUserDetails);
router.post(`/addToFavourites`,authPolicy,userController.addToFavourites)
router.post(`/addToWishlist`,authPolicy,userController.addToWishlist)
router.get(`/getFavourites`,authPolicy,userController.getFavourites)
router.get(`/getWishlist`,authPolicy,userController.getWishlist)
module.exports = router;