function toNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function validateCoordinateRange(latitude, longitude) {
  if (latitude < -90 || latitude > 90) {
    return "Latitude harus di antara -90 sampai 90";
  }

  if (longitude < -180 || longitude > 180) {
    return "Longitude harus di antara -180 sampai 180";
  }

  return null;
}

function validateRequiredAssetPayload(payload) {
  const requiredFields = ["name", "category_id", "latitude", "longitude", "condition", "year_built"];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      return `${field} wajib diisi`;
    }
  }

  return null;
}

module.exports = {
  toNumber,
  validateCoordinateRange,
  validateRequiredAssetPayload,
};
