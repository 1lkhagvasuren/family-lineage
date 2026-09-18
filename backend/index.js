const express = require("express");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());

const allowedRelationshipTypes = ["parent", "sibling", "spouse"];

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
       ORDER BY id`,
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
      ],
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
      ],
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
      [id],
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
      error: "personId, relatedPersonId, and relationshipType are required",
    });
  }

  if (personId === relatedPersonId) {
    return res.status(400).json({
      error: "A person cannot have a relationship with themselves",
    });
  }

  if (!allowedRelationshipTypes.includes(relationshipType)) {
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
      [personId, relatedPersonId, relationshipType],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database insert failed" });
  }
});

// Update a relationship
app.put("/relationships/:id", async (req, res) => {
  const { id } = req.params;
  const { personId, relatedPersonId, relationshipType } = req.body;

  if (!personId || !relatedPersonId || !relationshipType) {
    return res.status(400).json({
      error: "personId, relatedPersonId, and relationshipType are required",
    });
  }

  if (personId === relatedPersonId) {
    return res.status(400).json({
      error: "A person cannot have a relationship with themselves",
    });
  }

  if (!allowedRelationshipTypes.includes(relationshipType)) {
    return res.status(400).json({
      error: "Invalid relationship type",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE relationship
       SET
        person_id = $1,
        related_person_id = $2,
        relationship_type = $3
       WHERE id = $4
       RETURNING
        id,
        person_id AS "personId",
        related_person_id AS "relatedPersonId",
        relationship_type AS "relationshipType"`,
      [personId, relatedPersonId, relationshipType, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Relationship update failed" });
  }
});

// Delete a relationship
app.delete("/relationships/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM relationship WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Relationship not found" });
    }

    res.json({ message: "Relationship deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Relationship deletion failed" });
  }
});

// Find relationship between two people
app.get(
  "/relationships/between/:personId/:relatedPersonId",
  async (req, res) => {
    const personId = Number(req.params.personId);
    const relatedPersonId = Number(req.params.relatedPersonId);

    if (!Number.isInteger(personId) || !Number.isInteger(relatedPersonId)) {
      return res.status(400).json({ error: "Invalid person ID" });
    }

    if (personId === relatedPersonId) {
      return res.status(400).json({
        error: "The two people must be different",
      });
    }

    try {
      const peopleResult = await pool.query(`
        SELECT
          id,
          name,
          sex
        FROM person
        ORDER BY id
      `);

      const relationshipsResult = await pool.query(`
        SELECT
          person_id AS "personId",
          related_person_id AS "relatedPersonId",
          relationship_type AS "relationshipType"
        FROM relationship
      `);

      const people = peopleResult.rows;
      const relationships = relationshipsResult.rows;

      const personMap = new Map(people.map((person) => [person.id, person]));

      if (!personMap.has(personId) || !personMap.has(relatedPersonId)) {
        return res.status(404).json({
          error: "One or both people were not found",
        });
      }

      /*
       * Build a bidirectional graph.
       *
       * parent row:
       *   parent -> child
       *   child  -> parent
       *
       * sibling/spouse rows are symmetric.
       */
      const graph = new Map();

      for (const person of people) {
        graph.set(person.id, []);
      }

      for (const relationship of relationships) {
        const {
          personId: firstId,
          relatedPersonId: secondId,
          relationshipType,
        } = relationship;

        if (relationshipType === "parent") {
          graph.get(firstId).push({
            personId: secondId,
            type: "child",
          });

          graph.get(secondId).push({
            personId: firstId,
            type: "parent",
          });
        } else {
          graph.get(firstId).push({
            personId: secondId,
            type: relationshipType,
          });

          graph.get(secondId).push({
            personId: firstId,
            type: relationshipType,
          });
        }
      }

      /*
       * BFS: find the shortest path between the two people.
       */
      const queue = [personId];
      const visited = new Set([personId]);
      const previous = new Map();

      while (queue.length > 0) {
        const currentId = queue.shift();

        if (currentId === relatedPersonId) {
          break;
        }

        for (const edge of graph.get(currentId) || []) {
          if (visited.has(edge.personId)) {
            continue;
          }

          visited.add(edge.personId);

          previous.set(edge.personId, {
            from: currentId,
            type: edge.type,
          });

          queue.push(edge.personId);
        }
      }

      if (!visited.has(relatedPersonId)) {
        return res.json({
          person: {
            id: personId,
            name: personMap.get(personId).name,
          },
          relatedPerson: {
            id: relatedPersonId,
            name: personMap.get(relatedPersonId).name,
          },
          relationship: null,
          path: [],
          message: "No family connection was found",
        });
      }

      /*
       * Reconstruct the path.
       */
      const pathIds = [];
      let currentId = relatedPersonId;

      while (currentId !== personId) {
        pathIds.unshift(currentId);
        currentId = previous.get(currentId).from;
      }

      pathIds.unshift(personId);

      /*
       * Build parent lookup:
       *
       * parentsOf[child] = [parent1, parent2, ...]
       */
      const parentsOf = new Map();

      for (const relationship of relationships) {
        if (relationship.relationshipType !== "parent") {
          continue;
        }

        if (!parentsOf.has(relationship.relatedPersonId)) {
          parentsOf.set(relationship.relatedPersonId, []);
        }

        parentsOf.get(relationship.relatedPersonId).push(relationship.personId);
      }

      const getParents = (id) => parentsOf.get(id) || [];

      const getSex = (id) => {
        const sex = personMap.get(id)?.sex;
        return sex ? sex.toLowerCase() : null;
      };

      /*
       * Find all ancestors and their generation distance.
       *
       * generation 1 = parent
       * generation 2 = grandparent
       * generation 3 = great-grandparent
       */
      const getAncestors = (startId) => {
        const ancestors = new Map();
        const queue = [{ id: startId, generation: 0 }];

        while (queue.length > 0) {
          const { id, generation } = queue.shift();

          for (const parentId of getParents(id)) {
            if (ancestors.has(parentId)) {
              continue;
            }

            const parentGeneration = generation + 1;

            ancestors.set(parentId, parentGeneration);

            queue.push({
              id: parentId,
              generation: parentGeneration,
            });
          }
        }

        return ancestors;
      };

      const personAncestors = getAncestors(personId);
      const relatedAncestors = getAncestors(relatedPersonId);

      let relationshipName = null;

      /*
       * Direct relationship from the graph.
       */
      if (pathIds.length === 2) {
        const edge = previous.get(relatedPersonId);

        if (edge.type === "parent") {
          relationshipName = "parent";
        } else if (edge.type === "child") {
          relationshipName = "child";
        } else if (edge.type === "sibling") {
          relationshipName = "sibling";
        } else if (edge.type === "spouse") {
          relationshipName = "spouse";
        }
      }

      /*
       * Ancestor / descendant.
       *
       * If related person is an ancestor of person:
       *   parent -> grandparent -> ...
       *
       * If related person is a descendant:
       *   child -> grandchild -> ...
       */
      if (!relationshipName) {
        if (personAncestors.has(relatedPersonId)) {
          const generations = personAncestors.get(relatedPersonId);

          if (generations === 1) {
            relationshipName = "parent";
          } else if (generations === 2) {
            relationshipName = "grandparent";
          }
        }
      }

      if (!relationshipName) {
        if (relatedAncestors.has(personId)) {
          const generations = relatedAncestors.get(personId);

          if (generations === 1) {
            relationshipName = "child";
          } else if (generations === 2) {
            relationshipName = "grandchild";
          }
        }
      }

      /*
       * Sibling:
       * two people share at least one parent.
       */
      if (!relationshipName) {
        const personParents = getParents(personId);
        const relatedParents = getParents(relatedPersonId);

        const shareParent = personParents.some((parentId) =>
          relatedParents.includes(parentId),
        );

        if (shareParent) {
          relationshipName = "sibling";
        }
      }

      // Aunt / uncle:
      //
      // person -> parent -> sibling
      if (!relationshipName) {
        const personParents = getParents(personId);

        for (const parentId of personParents) {
          const parentSiblings = people.filter((person) => {
            if (person.id === parentId) {
              return false;
            }

            return graph
              .get(parentId)
              ?.some(
                (edge) =>
                  edge.personId === person.id && edge.type === "sibling",
              );
          });

          const relative = parentSiblings.find(
            (person) => person.id === relatedPersonId,
          );

          if (relative) {
            const sex = getSex(relative.id);

            if (sex === "female") {
              relationshipName = "aunt";
            } else if (sex === "male") {
              relationshipName = "uncle";
            } else {
              relationshipName = "aunt/uncle";
            }

            break;
          }
        }
      }

      // Niece / nephew:
      //
      // person -> sibling -> parent
      if (!relationshipName) {
        const relatedParents = getParents(relatedPersonId);

        for (const parentId of relatedParents) {
          const parentSiblings = people.filter((person) => {
            if (person.id === parentId) {
              return false;
            }

            return graph
              .get(parentId)
              ?.some(
                (edge) => edge.personId === personId && edge.type === "sibling",
              );
          });

          const relative = parentSiblings.find(
            (person) => person.id === personId,
          );

          if (relative) {
            const sex = getSex(relatedPersonId);

            if (sex === "female") {
              relationshipName = "niece";
            } else if (sex === "male") {
              relationshipName = "nephew";
            } else {
              relationshipName = "niece/nephew";
            }

            break;
          }
        }
      }

      // Cousin:
      //
      // person -> parent -> sibling -> child
      if (!relationshipName) {
        const personParents = getParents(personId);
        const relatedParents = getParents(relatedPersonId);

        for (const personParent of personParents) {
          for (const relatedParent of relatedParents) {
            if (personParent === relatedParent) {
              continue;
            }

            const areSiblings = graph
              .get(personParent)
              ?.some(
                (edge) =>
                  edge.personId === relatedParent && edge.type === "sibling",
              );

            if (areSiblings) {
              relationshipName = "cousin";
              break;
            }
          }

          if (relationshipName) {
            break;
          }
        }
      }

      res.json({
        person: {
          id: personId,
          name: personMap.get(personId).name,
        },
        relatedPerson: {
          id: relatedPersonId,
          name: personMap.get(relatedPersonId).name,
        },
        relationship: relationshipName,
        path: pathIds.map((id) => ({
          id,
          name: personMap.get(id).name,
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Relationship calculation failed",
      });
    }
  },
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
