const express = require("express");
const router = express.Router();
const affiliateController = require("../controllers/affiliateController");
const authPolicy = require("../utils/auth.policy");
router.post(`/affiliateRequest`,authPolicy,affiliateController.affiliateRequest);
router.get(`/getAffiliateRequest`, affiliateController.getAffiliateRequests);
router.get(`/getApprovedAffiliateRequests`, affiliateController.getApprovedAffiliateRequests);
router.post(`/updateAffiliateRequest`, affiliateController.updateAffiliateRequest);
router.get(`/calculateCommission`, affiliateController.calculateCommission);
router.get(`/sendCommissionEmail`, affiliateController.sendCommissionEmail);
// router.post(`/admin-verify`, adminController.adminVerify);
// router.post(`/admin-passwordReset`, adminController.resetPassword);

module.exports = router;