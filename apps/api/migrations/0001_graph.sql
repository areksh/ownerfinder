-- The curated graph, loaded whole from build/graph.sql on every deploy
-- (docs/api.md, ADR 11). Each row keeps its record as JSON in the data
-- model's own shape; the other columns exist only to be filtered on.

CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('entity', 'brand')),
  name TEXT NOT NULL,
  record TEXT NOT NULL CHECK (json_valid(record))
) STRICT;

CREATE TABLE relationships (
  id TEXT PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  record TEXT NOT NULL CHECK (json_valid(record))
) STRICT;

CREATE INDEX relationships_by_to ON relationships (to_id);
CREATE INDEX relationships_by_from ON relationships (from_id);

CREATE TABLE sources (
  id TEXT PRIMARY KEY,
  record TEXT NOT NULL CHECK (json_valid(record))
) STRICT;

CREATE TABLE criteria (
  id TEXT PRIMARY KEY,
  record TEXT NOT NULL CHECK (json_valid(record))
) STRICT;

CREATE TABLE listings (
  entity_id TEXT PRIMARY KEY,
  record TEXT NOT NULL CHECK (json_valid(record))
) STRICT;

-- A folded name or alias per row (foldForSearch), for LIKE matching.
CREATE TABLE search_terms (
  term TEXT NOT NULL,
  node_id TEXT NOT NULL,
  label TEXT NOT NULL,
  PRIMARY KEY (term, node_id)
) STRICT;
