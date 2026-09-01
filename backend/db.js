const { Pool } = require("pg");

const pool = new Pool({
  user: "lkhagvasuren",
  host: "localhost",
  database: "family_lineage",
  port: 5432,
});

module.exports = pool;