const pool = require("../config/db");
const { uploadAssetPhoto } = require("../services/fileUpload.service");
const asyncHandler = require("../utils/asyncHandler");
const {
  toNumber,
  validateCoordinateRange,
  validateRequiredAssetPayload,
} = require("../utils/validators");

async function getAssetById(id) {
  const query = `
    SELECT
      ia.id,
      ia.name,
      ia.category_id,
      ac.name AS category_name,
      ia.latitude,
      ia.longitude,
      ia.condition,
      ia.year_built,
      ia.description,
      ia.photo_url,
      ia.status,
      ia.created_at,
      ia.updated_at
    FROM infrastructure_assets ia
    JOIN asset_categories ac ON ac.id = ia.category_id
    WHERE ia.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

async function ensureActiveCategory(categoryId) {
  const categoryResult = await pool.query(
    "SELECT id FROM asset_categories WHERE id = $1 AND is_active = TRUE",
    [categoryId],
  );

  return categoryResult.rowCount > 0;
}

const listInfrastructureAssets = asyncHandler(async (req, res) => {
  const { search = "", categoryId, status } = req.query;

  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`ia.name ILIKE $${params.length}`);
  }

  if (categoryId) {
    params.push(Number(categoryId));
    conditions.push(`ia.category_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`ia.status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const query = `
    SELECT
      ia.id,
      ia.name,
      ia.category_id,
      ac.name AS category_name,
      ia.latitude,
      ia.longitude,
      ia.condition,
      ia.year_built,
      ia.description,
      ia.photo_url,
      ia.status,
      ia.created_at,
      ia.updated_at
    FROM infrastructure_assets ia
    JOIN asset_categories ac ON ac.id = ia.category_id
    ${whereClause}
    ORDER BY ia.created_at DESC
  `;

  const result = await pool.query(query, params);

  res.json({
    data: result.rows,
  });
});

const getInfrastructureAssetDetail = asyncHandler(async (req, res) => {
  const assetId = Number(req.params.id);

  if (Number.isNaN(assetId)) {
    return res.status(400).json({ message: "ID aset tidak valid" });
  }

  const asset = await getAssetById(assetId);

  if (!asset) {
    return res.status(404).json({ message: "Aset tidak ditemukan" });
  }

  return res.json({ data: asset });
});

const createInfrastructureAsset = asyncHandler(async (req, res) => {
  const requiredValidationError = validateRequiredAssetPayload(req.body);

  if (requiredValidationError) {
    return res.status(400).json({ message: requiredValidationError });
  }

  const categoryId = toNumber(req.body.category_id);
  const latitude = toNumber(req.body.latitude);
  const longitude = toNumber(req.body.longitude);
  const yearBuilt = toNumber(req.body.year_built);

  if ([categoryId, latitude, longitude, yearBuilt].some((v) => v === null)) {
    return res.status(400).json({ message: "Format numerik tidak valid" });
  }

  const coordinateError = validateCoordinateRange(latitude, longitude);

  if (coordinateError) {
    return res.status(400).json({ message: coordinateError });
  }

  const currentYear = new Date().getFullYear();

  if (yearBuilt < 1800 || yearBuilt > currentYear + 1) {
    return res.status(400).json({ message: "year_built tidak valid" });
  }

  const categoryExists = await ensureActiveCategory(categoryId);

  if (!categoryExists) {
    return res.status(400).json({ message: "Kategori tidak ditemukan atau nonaktif" });
  }

  const photoUrl = req.file ? await uploadAssetPhoto(req.file) : null;

  const insertQuery = `
    INSERT INTO infrastructure_assets (
      name,
      category_id,
      latitude,
      longitude,
      condition,
      year_built,
      description,
      photo_url,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `;

  const insertValues = [
    req.body.name,
    categoryId,
    latitude,
    longitude,
    req.body.condition,
    yearBuilt,
    req.body.description || null,
    photoUrl,
    req.body.status || "active",
  ];

  const insertResult = await pool.query(insertQuery, insertValues);
  const createdAsset = await getAssetById(insertResult.rows[0].id);

  return res.status(201).json({ data: createdAsset });
});

const updateInfrastructureAsset = asyncHandler(async (req, res) => {
  const assetId = Number(req.params.id);

  if (Number.isNaN(assetId)) {
    return res.status(400).json({ message: "ID aset tidak valid" });
  }

  const existingAsset = await getAssetById(assetId);

  if (!existingAsset) {
    return res.status(404).json({ message: "Aset tidak ditemukan" });
  }

  const nextCategoryId = req.body.category_id !== undefined
    ? toNumber(req.body.category_id)
    : existingAsset.category_id;

  const nextLatitude = req.body.latitude !== undefined
    ? toNumber(req.body.latitude)
    : toNumber(existingAsset.latitude);

  const nextLongitude = req.body.longitude !== undefined
    ? toNumber(req.body.longitude)
    : toNumber(existingAsset.longitude);

  const nextYearBuilt = req.body.year_built !== undefined
    ? toNumber(req.body.year_built)
    : toNumber(existingAsset.year_built);

  if ([nextCategoryId, nextLatitude, nextLongitude, nextYearBuilt].some((v) => v === null)) {
    return res.status(400).json({ message: "Format numerik tidak valid" });
  }

  const coordinateError = validateCoordinateRange(nextLatitude, nextLongitude);

  if (coordinateError) {
    return res.status(400).json({ message: coordinateError });
  }

  const currentYear = new Date().getFullYear();

  if (nextYearBuilt < 1800 || nextYearBuilt > currentYear + 1) {
    return res.status(400).json({ message: "year_built tidak valid" });
  }

  const categoryExists = await ensureActiveCategory(nextCategoryId);

  if (!categoryExists) {
    return res.status(400).json({ message: "Kategori tidak ditemukan atau nonaktif" });
  }

  let nextPhotoUrl = existingAsset.photo_url;
  if (req.file) {
    nextPhotoUrl = await uploadAssetPhoto(req.file);
  }

  const updateQuery = `
    UPDATE infrastructure_assets
    SET
      name = $1,
      category_id = $2,
      latitude = $3,
      longitude = $4,
      condition = $5,
      year_built = $6,
      description = $7,
      photo_url = $8,
      status = $9
    WHERE id = $10
    RETURNING id
  `;

  const updateValues = [
    req.body.name ?? existingAsset.name,
    nextCategoryId,
    nextLatitude,
    nextLongitude,
    req.body.condition ?? existingAsset.condition,
    nextYearBuilt,
    req.body.description ?? existingAsset.description,
    nextPhotoUrl,
    req.body.status ?? existingAsset.status,
    assetId,
  ];

  await pool.query(updateQuery, updateValues);

  const updatedAsset = await getAssetById(assetId);
  return res.json({ data: updatedAsset });
});

const deleteInfrastructureAsset = asyncHandler(async (req, res) => {
  const assetId = Number(req.params.id);

  if (Number.isNaN(assetId)) {
    return res.status(400).json({ message: "ID aset tidak valid" });
  }

  const deleteResult = await pool.query(
    "DELETE FROM infrastructure_assets WHERE id = $1 RETURNING id",
    [assetId],
  );

  if (deleteResult.rowCount === 0) {
    return res.status(404).json({ message: "Aset tidak ditemukan" });
  }

  return res.status(204).send();
});

module.exports = {
  listInfrastructureAssets,
  getInfrastructureAssetDetail,
  createInfrastructureAsset,
  updateInfrastructureAsset,
  deleteInfrastructureAsset,
};
