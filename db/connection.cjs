require("dotenv").config();

const { Sequelize } = require("sequelize");

const url = process.env.DATABASE_URI;

// Create a new Sequelize instance
const sequelize = new Sequelize(url, {
  dialect: "postgres",
});

// Test the database connection and synchronize the models
async function initializeDatabase() {
  try {
    await sequelize.authenticate(); // Test the database connection
    console.log(
      "PostgreSQL Database connection has been established successfully."
    );

    await sequelize.sync({ force: false }); // Automatically create missing tables
    console.log("Database tables have been synchronized.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

module.exports = { sequelize, initializeDatabase };
