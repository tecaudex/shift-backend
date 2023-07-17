const AWS = require("aws-sdk");
require("dotenv").config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const generatePresignedUrl = async (filename, fileType) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Expires: 100,
    ContentType: fileType,
    ACL: "public-read",
  };
  return await s3.getSignedUrlPromise("putObject", s3Params);
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
