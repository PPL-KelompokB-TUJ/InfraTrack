const express = require("express");

const {
  listInfrastructureAssets,
  getInfrastructureAssetDetail,
  createInfrastructureAsset,
  updateInfrastructureAsset,
  deleteInfrastructureAsset,
} = require("../controllers/infrastructureAsset.controller");
const { authenticateJWT, authorizeAdministrator } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

router.use(authenticateJWT, authorizeAdministrator);

router.get("/", listInfrastructureAssets);
router.get("/:id", getInfrastructureAssetDetail);
router.post("/", upload.single("photo"), createInfrastructureAsset);
router.put("/:id", upload.single("photo"), updateInfrastructureAsset);
router.delete("/:id", deleteInfrastructureAsset);

module.exports = router;
