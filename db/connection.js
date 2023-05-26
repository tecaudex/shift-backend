const { Sequelize } = require("sequelize");
const env = require("./env.js");

// Create a new Sequelize instance
const sequelize = new Sequelize(env.database, env.username, env.password, {
  host: env.host,
  port: env.port,
  dialect: env.dialect,
  // operatorsAliases: false,

  // pool: {
  //   max: env.max,
  //   min: env.pool.min,
  //   acquire: env.pool.acquire,
  //   idle: env.pool.idle
  // }
});

// Test the database connection
sequelize
  .authenticate()
  .then(() => {
    console.log(
      `PostgrsSQL Database connection has been established successfully.`.yellow
        .bold
    );
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

// Export the database connection
module.exports = sequelize;
