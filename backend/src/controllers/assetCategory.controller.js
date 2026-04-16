const pool = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

const getAssetCategories = asyncHandler(async (req, res) => {
  const { onlyActive = "true" } = req.query;

  const query = onlyActive === "true"
    ? "SELECT id, name, description, is_active FROM asset_categories WHERE is_active = TRUE ORDER BY name ASC"
    : "SELECT id, name, description, is_active FROM asset_categories ORDER BY name ASC";

  const result = await pool.query(query);

  res.json({
    data: result.rows,
  });
});

module.exports = {
  getAssetCategories,
};
