const express = require("express");
const router = express.Router();

const { generatePresignedUrl, deleteFile } = require("../controllers/s3.controller.cjs");
const { uuid } = require("uuidv4");
const authenticate = require("../middleware/authMiddleware.cjs");

router.use(authenticate);

// Generate pre-signed URL for front-end to upload file
router.get("getUrl", async (req, res) => {
  try {
    const fileType = req.query.fileType;
    const fileName = uuid();
    const url = await generatePresignedUrl(fileName, fileType);
    res.status(200).send({ url });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating S3 URL");
  }
});

router.delete("delete", async (req, res) => {
  try {
    const filename = req.query.filename;

    const data = await deleteFile(filename);
    res.status(200).send(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting S3 file");
  }
});

module.exports = router;
