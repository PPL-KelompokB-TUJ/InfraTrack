const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { randomUUID } = require("uuid");

const s3Client = require("../config/s3");

async function uploadAssetPhoto(file) {
  if (!file) {
    return null;
  }

  const bucketName = process.env.S3_BUCKET;

  if (!bucketName) {
    throw new Error("S3_BUCKET belum dikonfigurasi");
  }

  const fileExtension = file.originalname.includes(".")
    ? file.originalname.split(".").pop()
    : "jpg";

  const objectKey = `assets/${Date.now()}-${randomUUID()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);

  if (process.env.S3_PUBLIC_BASE_URL) {
    return `${process.env.S3_PUBLIC_BASE_URL}/${objectKey}`;
  }

  const endpoint = process.env.S3_ENDPOINT || "";
  return `${endpoint.replace(/\/$/, "")}/${bucketName}/${objectKey}`;
}

module.exports = {
  uploadAssetPhoto,
};
