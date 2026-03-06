# overrealdb Engine ↔ Frontend API Contract

Base URL: configurable, default `http://localhost:3100`
All requests include `Content-Type: application/json`.

---

## Health

### `GET /health`

Response:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "llm_configured": true,
  "embedder_configured": true,
  "mcp_enabled": false
}
```

Frontend polls every 30s. All fields except `status` are optional (graceful degradation).

---

## Agents

### `GET /agents`

Response: `AgentSummary[]`
```json
[
  {
    "id": "docs-assistant",
    "name": "Docs Assistant",
    "description": "Answers questions about SurrealDB documentation",
    "model": "qwen2.5:7b",
    "enabled": true
  }
]
```

### `GET /agents/:id`

Response: `AgentDetail`
```json
{
  "id": "docs-assistant",
  "name": "Docs Assistant",
  "description": "Answers questions about SurrealDB documentation",
  "model": "qwen2.5:7b",
  "enabled": true,
  "system_prompt": "You are a helpful assistant...",
  "tools": [
    { "kind": "search", "name": "Knowledge Search", "description": "Search knowledge base", "enabled": true }
  ],
  "mcp_endpoints": ["http://localhost:3100/mcp"],
  "memory_enabled": true,
  "temperature": 0.7,
  "max_tokens": 4096
}
```

### `POST /agents`

Body: `Partial<AgentDetail>` (at minimum `name` and `model`)
Response: `AgentDetail`

### `PUT /agents/:id`

Body: `Partial<AgentDetail>`
Response: `AgentDetail`

### `DELETE /agents/:id`

Response: `204 No Content`

### `GET /agents/tools`

Response: `AgentTool[]` — catalog of available tools
```json
[
  { "kind": "search", "name": "Knowledge Search", "description": "Semantic search over knowledge base", "enabled": true },
  { "kind": "query", "name": "SurrealQL Query", "description": "Execute read-only queries", "enabled": false },
  { "kind": "mcp", "name": "MCP Tool Call", "description": "Call external MCP tools", "enabled": false }
]
```

---

## Chat / Streaming

### `POST /chat/sessions`

Body:
```json
{ "agent_id": "docs-assistant" }
```

Response:
```json
{ "id": "session_abc123" }
```

### `GET /chat/sessions`

Query: `?user_id=` (optional)
Response: `Session[]`
```json
[
  { "id": "session_abc123", "agent": "docs-assistant", "user_id": null, "created_at": "2026-03-06T12:00:00Z" }
]
```

### `DELETE /chat/sessions/:id`

Response: `204 No Content`

### `GET /chat/sessions/:id/messages`

Query: `?limit=50&offset=0` (optional)
Response: `Message[]`
```json
[
  {
    "id": "msg_001",
    "role": "user",
    "content": "What is SurrealQL?",
    "model": null,
    "tokens_used": null,
    "created_at": "2026-03-06T12:00:01Z"
  },
  {
    "id": "msg_002",
    "role": "assistant",
    "content": "SurrealQL is...",
    "model": "qwen2.5:7b",
    "tokens_used": 150,
    "created_at": "2026-03-06T12:00:03Z"
  }
]
```

### `POST /chat/sessions/:id/stream` (SSE)

Body:
```json
{ "message": "What is SurrealQL?" }
```

Response: `text/event-stream` — Server-Sent Events:

```
data: {"type":"token","text":"SurrealQL"}
data: {"type":"token","text":" is a"}
data: {"type":"token","text":" query language..."}
data: {"type":"tool_result","name":"Knowledge Search","result":{"chunks":3}}
data: {"type":"done","usage":{"prompt_tokens":120,"completion_tokens":85}}
data: {"type":"error","message":"rate limit exceeded"}
```

**SSE Event Types:**
| type | payload | description |
|------|---------|-------------|
| `token` | `{"text":"..."}` | Streaming text token |
| `tool_result` | `{"name":"...","result":...}` | Tool execution completed |
| `done` | `{"usage":{...}}` | Stream complete |
| `error` | `{"message":"..."}` | Error occurred |

---

## Knowledge

### `GET /knowledge/sources`

Query: `?kind=&limit=&offset=` (all optional)
Response: `KnowledgeSource[]`
```json
[
  { "id": "src_001", "name": "SurrealDB Docs", "kind": "markdown", "document_count": 6 }
]
```

### `GET /knowledge/sources/:id/documents`

**Frontend expects this path.** Backend currently serves `GET /knowledge/documents?source_id=`.

Either add this route alias OR the backend agent can adjust. Both work.

Response: `KnowledgeDocument[]`
```json
[
  { "id": "doc_001", "source_id": "src_001", "title": "SurrealQL Guide", "chunk_count": 12 }
]
```

### `DELETE /knowledge/sources/:id`

Response: `204 No Content`

### `GET /knowledge/entities`

Query: `?q=search_term` (optional text search), `?entity_type=`, `?limit=`, `?offset=`
Response: `KnowledgeEntity[]`
```json
[
  { "id": "ent_001", "name": "SurrealDB", "entity_type": "technology", "description": "A multi-model database" }
]
```

### `GET /knowledge/entities/:id/facts`

**Frontend expects this path.** Backend currently serves `GET /knowledge/facts?subject=`.

Either add this route alias OR adjust frontend. Recommended: add route.

Response: `KnowledgeFact[]`
```json
[
  { "id": "fact_001", "subject": "SurrealDB", "predicate": "is_a", "object": "multi-model database" }
]
```

### `GET /knowledge/communities`

Query: `?limit=&offset=` (optional)
Response: `KnowledgeCommunity[]`
```json
[
  { "id": "com_001", "title": "Database Technologies", "summary": "Cluster of database-related entities", "member_count": 5 }
]
```

### `GET /knowledge/graph`

Query: `?q=search_term` (optional — filter subgraph)
Response: `KnowledgeGraphData`
```json
{
  "nodes": [
    { "id": "ent_001", "label": "SurrealDB", "type": "entity" },
    { "id": "doc_001", "label": "SurrealQL Guide", "type": "document" },
    { "id": "fact_001", "label": "is_a: multi-model database", "type": "fact" }
  ],
  "edges": [
    { "source": "ent_001", "target": "fact_001", "label": "has_fact" },
    { "source": "doc_001", "target": "ent_001", "label": "mentions" }
  ]
}
```

**This is a composite endpoint** — aggregates entities, documents, facts, and their relationships into a single graph payload for Sigma.js visualization. Backend can build this from existing `/knowledge/graph/entity/:id/related` + list queries.

### `POST /knowledge/search`

Body:
```json
{ "query": "how does authentication work", "top_k": 5 }
```

Response:
```json
{
  "results": [
    {
      "chunk_id": "chunk_001",
      "parent": "doc_003",
      "content": "Authentication in SurrealDB uses...",
      "distance": 0.23,
      "metadata": { "source": "auth-guide.md" }
    }
  ],
  "count": 1
}
```

### `POST /knowledge/ingest`

Body:
```json
{
  "documents": [
    {
      "content": "# My Document\n\nContent here...",
      "source": "manual-upload",
      "metadata": { "title": "My Document" }
    }
  ]
}
```

Response:
```json
{ "chunks_created": 8 }
```

---

## Pipelines

### `GET /pipelines`

Response: `Pipeline[]`
```json
[
  {
    "id": "pipe_001",
    "name": "Docs Ingestion",
    "description": "Ingest markdown docs into knowledge graph",
    "status": "idle",
    "steps": [
      { "id": "step_1", "kind": "file_connector", "label": "Read Files", "config": {"path": "./docs"}, "position": {"x": 100, "y": 200} },
      { "id": "step_2", "kind": "chunker", "label": "Split Text", "config": {"max_tokens": 512}, "position": {"x": 350, "y": 200} },
      { "id": "step_3", "kind": "embedder", "label": "Embed", "config": {}, "position": {"x": 600, "y": 200} },
      { "id": "step_4", "kind": "surrealdb_sink", "label": "Store", "config": {}, "position": {"x": 850, "y": 200} }
    ],
    "edges": [
      {"source": "step_1", "target": "step_2"},
      {"source": "step_2", "target": "step_3"},
      {"source": "step_3", "target": "step_4"}
    ]
  }
]
```

### `GET /pipelines/:id`

Response: `Pipeline` (same shape as above)

### `POST /pipelines`

Body:
```json
{ "name": "My Pipeline", "description": "optional" }
```

Response: `Pipeline` (with generated ID, empty steps/edges, status "idle")

### `PUT /pipelines/:id`

Body: `Partial<Pipeline>` — can update name, description, steps, edges
Response: `Pipeline`

### `DELETE /pipelines/:id`

Response: `204 No Content`

### `POST /pipelines/:id/run`

Response:
```json
{ "run_id": "run_001", "status": "running" }
```

---

## Connectors

### `GET /connectors`

Response: `Connector[]`
```json
[
  { "id": "conn_001", "name": "Local Files", "kind": "file", "config": {"base_path": "./data"} }
]
```

---

## Types Reference

```typescript
// src/types/overrealdb.ts — canonical frontend types

interface KnowledgeSource { id: string; name: string; kind: string; document_count: number; }
interface KnowledgeDocument { id: string; source_id: string; title: string; chunk_count: number; }
interface KnowledgeEntity { id: string; name: string; entity_type: string; description: string; }
interface KnowledgeFact { id: string; subject: string; predicate: string; object: string; }
interface KnowledgeCommunity { id: string; title: string; summary: string; member_count: number; }
interface GraphNode { id: string; label: string; type: 'entity' | 'document' | 'fact' | 'community'; }
interface GraphEdge { source: string; target: string; label: string; }
interface KnowledgeGraphData { nodes: GraphNode[]; edges: GraphEdge[]; }

interface Pipeline { id: string; name: string; description: string; status: string; steps: PipelineStep[]; edges: PipelineEdge[]; }
interface PipelineStep { id: string; kind: string; label?: string; config: Record<string, unknown>; position: { x: number; y: number }; }
interface PipelineEdge { source: string; target: string; }
interface Connector { id: string; name: string; kind: string; config: Record<string, unknown>; }

interface AgentDetail {
  id: string; name: string; description?: string; model: string; enabled: boolean;
  system_prompt: string; tools: AgentTool[]; mcp_endpoints: string[];
  memory_enabled: boolean; temperature: number; max_tokens: number;
}
interface AgentTool { kind: string; name: string; description: string; enabled: boolean; }
```

---

## Gap Analysis: Frontend ↔ Existing Backend

| Frontend expects | Backend has | Status |
|---|---|---|
| `GET /health` with `version`, `llm_configured`, `embedder_configured`, `mcp_enabled` | Health response extended | RESOLVED |
| `GET /agents/tools` | Route added — returns tool catalog | RESOLVED |
| Agent CRUD returns full `AgentDetail` with flat `temperature`, `max_tokens`, `memory_enabled`, normalized `tools` | Transform applied on all agent responses | RESOLVED |
| `DELETE /agents/:id` returns 204 | Returns `StatusCode::NO_CONTENT` | RESOLVED |
| `GET /knowledge/sources/:id/documents` | Route alias added | RESOLVED |
| `GET /knowledge/entities/:id/facts` | Route alias added | RESOLVED |
| `GET /knowledge/entities?q=` | Text search filter added | RESOLVED |
| `GET /knowledge/graph?q=` | Composite endpoint added (entities + facts + documents) | RESOLVED |
| Knowledge lists return flat arrays | Unwrapped `{sources:[...]}` → `[...]` for sources, docs, entities, facts, communities | RESOLVED |
| `POST /knowledge/ingest` with `{documents:[{content,source,metadata}]}` | `source` accepted as alias for `parent` | RESOLVED |
| `DELETE /knowledge/sources/:id` returns 204 | Returns `StatusCode::NO_CONTENT` | RESOLVED |
| `Pipeline.steps[].position` | `VisualPipelineStep` with position added to `PipelineConfig` | RESOLVED |
| `Pipeline.edges` as part of Pipeline | `VisualPipelineEdge` added to `PipelineConfig` | RESOLVED |
| `Pipeline.status` field | Added with default `"idle"` | RESOLVED |
| Pipeline CRUD returns full object | POST/PUT fetch-and-return after mutation | RESOLVED |
| `DELETE /pipelines/:id` returns 204 | Returns `StatusCode::NO_CONTENT` | RESOLVED |
| `mcp_endpoints` on agents | Added to `AgentConfig` type + schema | RESOLVED |

All gaps resolved. Chat/streaming SSE format was already compatible.
