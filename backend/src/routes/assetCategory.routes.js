const express = require("express");

const { authenticateJWT, authorizeAdministrator } = require("../middlewares/auth.middleware");
const { getAssetCategories } = require("../controllers/assetCategory.controller");

const router = express.Router();

router.use(authenticateJWT, authorizeAdministrator);

router.get("/", getAssetCategories);

module.exports = router;
