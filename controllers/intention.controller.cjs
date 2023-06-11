const Intention = require("../models/intention.model.cjs");
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = process.env.INTENTION_ENCRYPTION_KEY;
const iv = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(ciphertext) {
  const [ivStr, encrypted] = ciphertext.split(":");
  const iv = Buffer.from(ivStr, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

exports.setIntention = async (req, res) => {
  const user = req.user;
  const { event, intention } = req.body;

  if (!event || !intention) {
    return res
      .status(400)
      .json({ error: "Please provide an event and an intention." });
  }

  try {
    const newIntention = await Intention.create({
      userId: user._id,
      event: encrypt(event),
      intention: encrypt(intention),
    });

    return res.status(200).json(newIntention);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error while saving Intention to DB" });
  }
};
