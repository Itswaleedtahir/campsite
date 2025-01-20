const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog");
const authPolicy = require("../utils/auth.policy");

router.post('/createBlog',blogController.createBlog)
router.get('/getBlogs',blogController.getBlogs)
router.post('/updateBlog/:id',blogController.updateBlog)

module.exports = router;