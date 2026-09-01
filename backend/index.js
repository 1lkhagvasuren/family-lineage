const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/people", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM person ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.post("/people", async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO person (name) VALUES ($1) RETURNING *",
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});

app.get("/relationships", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        person_id AS "personId",
        related_person_id AS "relatedPersonId",
        relationship_type AS "relationshipType"
      FROM relationship
      ORDER BY id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.post("/relationships", async (req, res) => {
  const { personId, relatedPersonId, relationshipType } = req.body;

  if (!personId || !relatedPersonId || !relationshipType) {
  return res.status(400).json({
    error: "personId, relatedPersonId, and relationshipType are required",
  });
}

const allowedTypes = ["parent", "sibling", "spouse"];

if (!allowedTypes.includes(relationshipType)) {
  return res.status(400).json({
    error: "Invalid relationship type",
  });
}

  try {
    const result = await pool.query(
      `INSERT INTO relationship
        (person_id, related_person_id, relationship_type)
       VALUES ($1, $2, $3)
       RETURNING
        id,
        person_id AS "personId",
        related_person_id AS "relatedPersonId",
        relationship_type AS "relationshipType"`,
      [personId, relatedPersonId, relationshipType]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});