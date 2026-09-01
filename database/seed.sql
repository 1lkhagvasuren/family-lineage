-- Demo data for Family Lineage

BEGIN;

-- Clear existing demo data
DELETE FROM app_user;
DELETE FROM relationship;
DELETE FROM person;

-- People
INSERT INTO person (id, name) VALUES
  (1, 'Atharva'),
  (2, 'Sister'),
  (3, 'Father'),
  (4, 'Grandmother'),
  (5, 'Grandfather'),
  (6, 'Brother'),
  (7, 'Mother'),
  (8, 'Uncle'),
  (9, 'Aunt'),
  (10, 'Cousin');

-- Relationships
INSERT INTO relationship (person_id, related_person_id, relationship_type) VALUES
  -- Atharva's immediate family
  (3, 1, 'parent'),
  (7, 1, 'parent'),
  (1, 2, 'sibling'),
  (1, 6, 'sibling'),

  -- Parents are spouses
  (3, 7, 'spouse'),

  -- Father's parents
  (4, 3, 'parent'),
  (5, 3, 'parent'),
  (4, 5, 'spouse'),

  -- Father's sibling
  (3, 8, 'sibling'),

  -- Mother's sibling
  (7, 9, 'sibling'),

  -- Cousin
  (8, 10, 'parent');

-- Atharva is the application user
INSERT INTO app_user (person_id)
VALUES (1);

-- Keep sequences ahead of the explicitly assigned IDs
SELECT setval('person_id_seq', (SELECT MAX(id) FROM person));
SELECT setval('relationship_id_seq', (SELECT MAX(id) FROM relationship));
SELECT setval('app_user_id_seq', (SELECT MAX(id) FROM app_user));

COMMIT;