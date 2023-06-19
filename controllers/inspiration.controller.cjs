const Inspiration = require("../models/inspiration.cjs");
const { sequelize } = require("../db/connection.cjs");

async function GetInpiration(req, res) {
  try {
    console.log("GetInpiration");
    const inspiration = await Inspiration.findOne({
      order: sequelize.random(),
    });
    res.status(200).json(inspiration);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
}

async function SetInpiration(req, res) {
  try {
    const inspiration = await Inspiration.create({
      heading: req.body.heading,
      subheading: req.body.subHeading,
    });
    return res.status(200).json(inspiration);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
}

module.exports = {
  GetInpiration,
  SetInpiration,
};
