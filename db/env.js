const env = {
  database: "mntra",
  username: "postgres",
  password: "nadeem6525",
  host: "localhost",
  dialect: "postgres",
  port: 6525,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

module.exports = env;
