const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authPolicy = require("../utils/auth.policy");
router.post(`/admin-signup`, adminController.addAdmin);
router.post(`/admin-login`, adminController.adminLogin);
router.post(`/admin-forget`, adminController.forgetPassword);
router.post(`/admin-verify`, adminController.adminVerify);
router.post(`/admin-passwordReset`, adminController.resetPassword);
router.get(`/admin-getAdmins`, adminController.getAdmins);
router.delete(`/admin-delete/:id`,authPolicy,adminController.deleteAdmin);

module.exports = router;