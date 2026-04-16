const express = require("express");

const infrastructureAssetRoutes = require("./infrastructureAsset.routes");
const assetCategoryRoutes = require("./assetCategory.routes");

const router = express.Router();

router.use("/infrastructure-assets", infrastructureAssetRoutes);
router.use("/asset-categories", assetCategoryRoutes);

module.exports = router;
