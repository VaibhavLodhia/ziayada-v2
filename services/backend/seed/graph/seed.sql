-- Ziyada knowledge graph — dev seed (Apache AGE).
-- Idempotent: every statement uses MERGE. Run via app.db.graph.ensure_seeded().
-- No params, so this runs fine under the simple query protocol.
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Nodes -------------------------------------------------------------------
SELECT * FROM cypher('ziyada', $$ MERGE (s:System {name:'Ziyada Backend'})     SET s.tier='core'     $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (s:System {name:'Ziyada Frontend'})    SET s.tier='core'     $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (s:System {name:'Ollama Cloud'})       SET s.tier='external' $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (s:System {name:'OWASP Harness'})      SET s.tier='security' $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (s:System {name:'GitLab Self-hosted'}) SET s.tier='infra'    $$) as (v agtype);

SELECT * FROM cypher('ziyada', $$ MERGE (p:Person {name:'Layla N.'})   SET p.role='Principal'             $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (p:Person {name:'Khusrav B.'}) SET p.role='Backend+AI'            $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (p:Person {name:'Vaibhav L.'}) SET p.role='Frontend+Architecture' $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (p:Person {name:'Henry K.'})   SET p.role='Security+QA'           $$) as (v agtype);

SELECT * FROM cypher('ziyada', $$ MERGE (d:Decision {id:'D-2026-051'}) SET d.summary='Adopt Ollama Cloud for inference',  d.date='2026-05-15', d.state='done'    $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (d:Decision {id:'D-2026-052'}) SET d.summary='Bootstrap FastAPI gateway',         d.date='2026-05-26', d.state='done'    $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (d:Decision {id:'D-2026-053'}) SET d.summary='Add langgraph tool-calling agent',  d.date='2026-05-27', d.state='done'    $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (d:Decision {id:'D-2026-054'}) SET d.summary='Adopt Apache AGE for the graph layer', d.date='2026-06-02', d.state='done' $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MERGE (d:Decision {id:'D-2026-055'}) SET d.summary='Wire pgvector for semantic search', d.date='2026-05-30', d.state='planned' $$) as (v agtype);

-- Edges -------------------------------------------------------------------
SELECT * FROM cypher('ziyada', $$ MATCH (p:Person {name:'Khusrav B.'}), (s:System {name:'Ziyada Backend'})  MERGE (p)-[:OWNS]->(s) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (p:Person {name:'Vaibhav L.'}), (s:System {name:'Ziyada Frontend'}) MERGE (p)-[:OWNS]->(s) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (p:Person {name:'Henry K.'}),   (s:System {name:'OWASP Harness'})   MERGE (p)-[:OWNS]->(s) $$) as (v agtype);

SELECT * FROM cypher('ziyada', $$ MATCH (a:System {name:'Ziyada Backend'}),  (b:System {name:'Ollama Cloud'})  MERGE (a)-[:DEPENDS_ON]->(b) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (a:System {name:'Ziyada Backend'}),  (b:System {name:'OWASP Harness'}) MERGE (a)-[:DEPENDS_ON]->(b) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (a:System {name:'Ziyada Frontend'}), (b:System {name:'Ziyada Backend'})MERGE (a)-[:DEPENDS_ON]->(b) $$) as (v agtype);

SELECT * FROM cypher('ziyada', $$ MATCH (d:Decision {id:'D-2026-051'}), (p:Person {name:'Layla N.'})   MERGE (d)-[:INVOLVED]->(p) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (d:Decision {id:'D-2026-052'}), (p:Person {name:'Khusrav B.'}) MERGE (d)-[:INVOLVED]->(p) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (d:Decision {id:'D-2026-053'}), (p:Person {name:'Khusrav B.'}) MERGE (d)-[:INVOLVED]->(p) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (d:Decision {id:'D-2026-054'}), (p:Person {name:'Khusrav B.'}) MERGE (d)-[:INVOLVED]->(p) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (d:Decision {id:'D-2026-055'}), (p:Person {name:'Khusrav B.'}) MERGE (d)-[:INVOLVED]->(p) $$) as (v agtype);

SELECT * FROM cypher('ziyada', $$ MATCH (d:Decision {id:'D-2026-052'}), (s:System {name:'Ziyada Backend'}) MERGE (d)-[:RELATES_TO]->(s) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (d:Decision {id:'D-2026-053'}), (s:System {name:'Ollama Cloud'})   MERGE (d)-[:RELATES_TO]->(s) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (d:Decision {id:'D-2026-051'}), (s:System {name:'Ollama Cloud'})   MERGE (d)-[:RELATES_TO]->(s) $$) as (v agtype);

SELECT * FROM cypher('ziyada', $$ MATCH (a:Decision {id:'D-2026-053'}), (b:Decision {id:'D-2026-052'}) MERGE (a)-[:FOLLOWS]->(b) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (a:Decision {id:'D-2026-054'}), (b:Decision {id:'D-2026-053'}) MERGE (a)-[:FOLLOWS]->(b) $$) as (v agtype);
SELECT * FROM cypher('ziyada', $$ MATCH (a:Decision {id:'D-2026-055'}), (b:Decision {id:'D-2026-054'}) MERGE (a)-[:FOLLOWS]->(b) $$) as (v agtype);
