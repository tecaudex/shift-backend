const AWS = require("aws-sdk");
require("dotenv").config();
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const {
  getSignedUrl,
  S3RequestPresigner,
} = require("@aws-sdk/s3-request-presigner");


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

const generatePresignedUrl = async (fileName) => {
  const client = new S3Client({
    region: process.env.AWS_BUCKET_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  });
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
};

const deleteFile = async (filename) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
  };
  return s3.deleteObject(s3Params);
};

module.exports = {
  generatePresignedUrl,
  deleteFile,
};
