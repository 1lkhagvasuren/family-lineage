const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.get("/people", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM person ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});