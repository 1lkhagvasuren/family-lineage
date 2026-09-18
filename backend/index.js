const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());

// Get all people
app.get("/people", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        sex,
        TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
        is_alive AS "isAlive"
       FROM person
       ORDER BY id`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Create a person
app.post("/people", async (req, res) => {
  const { name, sex, dateOfBirth, isAlive } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO person
        (name, sex, date_of_birth, is_alive)
       VALUES ($1, $2, $3, $4)
       RETURNING
        id,
        name,
        sex,
        TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
        is_alive AS "isAlive"`,
      [
        name,
        sex || null,
        dateOfBirth || null,
        isAlive !== undefined ? isAlive : true,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Update a person
app.put("/people/:id", async (req, res) => {
  const { id } = req.params;
  const { name, sex, dateOfBirth, isAlive } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE person
       SET
        name = $1,
        sex = $2,
        date_of_birth = $3,
        is_alive = $4
       WHERE id = $5
       RETURNING
        id,
        name,
        sex,
        TO_CHAR(date_of_birth, 'YYYY-MM-DD') AS "dateOfBirth",
        is_alive AS "isAlive"`,
      [
        name,
        sex || null,
        dateOfBirth || null,
        isAlive !== undefined ? isAlive : true,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database update failed" });
  }
});

// Delete a person
app.delete("/people/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM person WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Person not found" });
    }

    res.json({ message: "Person deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Person cannot be deleted because it is still referenced",
    });
  }
});

// Get all relationships
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

// Create a relationship
app.post("/relationships", async (req, res) => {
  const { personId, relatedPersonId, relationshipType } = req.body;

  if (!personId || !relatedPersonId || !relationshipType) {
    return res.status(400).json({
      error:
        "personId, relatedPersonId, and relationshipType are required",
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