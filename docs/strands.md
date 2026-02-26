# PDLC Agent Architecture

## Overview

This document describes the architecture for a Product Development Lifecycle (PDLC) system built on AWS Bedrock AgentCore with Strands. The system uses a feature tree as the primary navigation and scoping mechanism, with three specialized orchestrator agents exposed via A2A (Agent-to-Agent) protocol over JSON-RPC 2.0. Each agent operates within the context of a feature tree node, producing versioned document artifacts through conversation.

The three agents are:

- **Product Manager** — Owns discovery documents, PRDs, and user stories. Focuses on problem definition, requirements, and acceptance criteria.
- **Architect** — Owns technical specifications, system design documents, and integration plans. Focuses on architecture decisions, trade-offs, and non-functional requirements.
- **Lead Engineer** — Owns implementation plans, task breakdowns, and test plans. Focuses on engineering feasibility, effort estimation, and delivery sequencing.

All three agents share the same artifact store (Postgres), the same feature tree, and the same A2A protocol surface. They can read each other's artifacts but only create and update artifacts of their own types.

---

## UX Model

### The Feature Tree

The feature tree is a hierarchical sidebar that represents the product's feature breakdown. It is the primary navigation and the implicit scoping mechanism for all agent interactions.

```
🏗 Platform
├─ 🔐 Auth Service
│  ├─ 📋 Discovery          v2 ✅
│  ├─ 📄 PRD                v4 📝
│  ├─ 🏛 Technical Spec     v2 📝
│  ├─ 📝 US-1: Login Flow   v1 📝
│  ├─ 📝 US-2: Password Reset v1 📝
│  └─ 🔧 Impl Plan          v1 📝
├─ 💳 Billing
│  ├─ 📋 Discovery          v1 📝
│  └─ (more artifacts...)
└─ 📊 Analytics
   └─ (empty — no artifacts yet)
```

When a user clicks a feature node, the system loads the conversation scoped to that node. All artifacts created during that conversation are automatically parented to the node. The user never specifies where an artifact goes — the tree position is implicit.

Each node can have conversations with any of the three agents. The user selects which agent they are talking to, and the conversation + artifacts are scoped accordingly.

### Artifact Ownership by Agent

| Artifact Type | Owner Agent | Other Agents |
|---|---|---|
| Discovery | Product Manager | Read |
| PRD | Product Manager | Read |
| User Stories | Product Manager | Read |
| Technical Spec | Architect | Read |
| System Design | Architect | Read |
| Integration Plan | Architect | Read |
| Implementation Plan | Lead Engineer | Read |
| Task Breakdown | Lead Engineer | Read |
| Test Plan | Lead Engineer | Read |

This ownership model is enforced at the tool level. The `save_artifact` tool validates that the calling agent is permitted to create or update the given artifact type. All agents have unrestricted `get_artifact` and `list_artifacts` access.

### Chat and Artifact Separation

The interface is a three-column layout on desktop.

**Left column** — Feature tree. Persistent. Shows the full hierarchy with artifact children nested under each feature node. Artifacts display their current version and status via icons.

**Center column** — Conversation. Scoped to the active feature node and the selected agent. Chat messages are standard conversational bubbles. Artifact events (created, updated, promoted) render as inline cards within the conversation stream. These cards are not raw document content — they are structured summaries with action buttons.

**Right column** — Artifact viewer. Collapsed by default. Opens when the user clicks an artifact card in the chat or a node in the tree. Shows the full rendered document with a version stepper at the bottom. Supports inline diff view between any two versions.

On mobile, the tree collapses to a breadcrumb bar. The right column becomes a slide-over panel triggered by tapping artifact cards in the conversation.

### Inline Artifact Cards

Every artifact event returned by the Lambda renders as a card in the chat stream.

For a creation event, the card shows the artifact type icon, the title, the version (v1), a brief summary of sections or content, and buttons for Open (loads in right pane), Edit, and Chat About This (prefills input).

For an update event, the card shows the artifact type icon, the title, the version transition (v3 → v4), the section that changed, the change summary, and a View Changes button that opens the right pane in diff mode.

For a status transition, the card shows a visual status change (draft → approved), the timestamp, and an Undo button.

The cards are the bridge between conversation and documents. The agent never dumps full artifact content into the chat. It speaks conversationally about what it did and the card provides the structured reference.

### Quick Actions

After certain agent responses, the UI presents quick-action buttons below the message. These are contextual suggestions based on what just happened.

After creating a discovery doc: "Start PRD", "Refine Discovery", "Switch to Architect".

After creating user stories: "Review Coverage", "Estimate Stories", "Switch to Lead Engineer".

After the Architect produces a technical spec: "Review with PM artifacts", "Start Implementation Plan", "Flag Concerns".

These are rendered client-side based on the artifact events in the response. They prefill the chat input or trigger agent switches.

### Agent Switching

The user can switch between the three agents within the same feature node. A selector at the top of the chat pane shows which agent is active. Switching agents loads that agent's conversation history for the current node.

When switching agents, the system passes a handoff context that includes a summary of what the previous agent produced. For example, switching from Product Manager to Architect after the PRD is complete sends the Architect a context like: "The Product Manager has completed a PRD (v4, approved) with functional requirements covering OAuth2, MFA, session management, and rate limiting. Discovery doc (v2) is also approved. Three user stories exist in draft."

This handoff context is assembled by the Lambda from the artifact manifest and LTM summaries before invoking the new agent.

### Version History UX

Each artifact in the right pane has a version stepper at the bottom — a horizontal timeline of version dots. The current version is filled, previous versions are hollow. Hovering a dot shows the change summary and timestamp. Clicking loads that version.

A diff toggle lets the user view changes between any two versions. Additions are highlighted green, removals have red strikethrough. The diff can be computed client-side or requested via the `get_artifact_diff` tool.

The version history also shows which agent and which conversation session produced each version, creating a full audit trail from conversation to document.

---

## Agent-Lambda Interaction

### High-Level Flow

```
Frontend (Feature Tree + Chat)
    │
    │  User sends message in chat
    │  (scoped to feature node + selected agent)
    │
    ▼
API Gateway (WebSocket or REST)
    │
    ▼
Lambda (A2A Handler + Tool Executor)
    │
    │  1. Resolve session context (node_id, agent_type, actor_id)
    │  2. Build tree context injection
    │  3. Invoke agent via A2A JSON-RPC
    │  4. Process tool calls against Postgres
    │  5. Format response with conversation + artifact events
    │
    ▼
AgentCore Runtime (Strands Agent)
    │
    │  Agent reasons, calls tools, produces response
    │  STM maintains within-session context
    │  LTM provides cross-session recall
    │
    ▼
Lambda receives agent response
    │
    │  Extracts: conversational messages + tool call results
    │  Persists: artifact changes to Postgres
    │  Writes: conversation_artifact_refs for lineage
    │  Formats: structured response for frontend
    │
    ▼
Frontend
    │
    │  Renders chat messages as bubbles
    │  Renders artifact events as inline cards
    │  Updates feature tree in real-time
    │  Opens/scrolls artifact viewer as needed
```

### JSON-RPC 2.0 Compliance

All agent invocations follow the A2A protocol over JSON-RPC 2.0. The Lambda is the JSON-RPC client. Each Strands agent on AgentCore exposes a JSON-RPC 2.0 endpoint.

#### Agent Discovery

Before routing, the Lambda resolves which agent endpoint to call based on the selected agent type. Each agent publishes an A2A Agent Card at `/.well-known/agent.json`:

```json
{
  "name": "product-manager-agent",
  "description": "PDLC Product Manager. Owns discovery docs, PRDs, and user stories.",
  "url": "https://agentcore.us-east-1.amazonaws.com/agents/pm-agent-id",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": false
  },
  "skills": [
    {
      "id": "create-discovery",
      "name": "Create Discovery Document",
      "description": "Creates a new discovery document for a feature"
    },
    {
      "id": "create-prd",
      "name": "Create PRD",
      "description": "Creates a product requirements document"
    },
    {
      "id": "create-user-story",
      "name": "Create User Stories",
      "description": "Creates user stories with acceptance criteria"
    }
  ],
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["text"]
}
```

Similar cards exist for the Architect and Lead Engineer agents with their respective skills.

#### Sending a Task

The Lambda sends a `tasks/send` request to the resolved agent endpoint:

```json
{
  "jsonrpc": "2.0",
  "id": "req-abc-001",
  "method": "tasks/send",
  "params": {
    "id": "task-xyz-789",
    "sessionId": "session-auth-service-pm-user-jane-doe",
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "data",
          "data": {
            "type": "tree_context",
            "node_id": "auth-service",
            "node_title": "Auth Service",
            "node_path": "/platform/auth-service",
            "parent": "Platform",
            "siblings": ["Billing", "Analytics"],
            "child_artifacts": [
              {
                "artifact_id": "disc-auth",
                "type": "discovery",
                "title": "Auth Service Discovery",
                "version": 2,
                "status": "approved",
                "owner_agent": "product-manager"
              },
              {
                "artifact_id": "prd-auth",
                "type": "prd",
                "title": "Auth Service PRD",
                "version": 4,
                "status": "draft",
                "owner_agent": "product-manager"
              },
              {
                "artifact_id": "ts-auth",
                "type": "technical_spec",
                "title": "Auth Service Technical Spec",
                "version": 2,
                "status": "draft",
                "owner_agent": "architect"
              }
            ]
          }
        },
        {
          "type": "text",
          "text": "Add rate limiting requirements to the PRD. We need 1000 req/min per tenant with burst allowance."
        }
      ]
    }
  }
}
```

The `tree_context` data part is injected by the Lambda on every request. It gives the agent structural awareness of where it is in the feature tree and what artifacts exist. The agent uses this to decide which artifacts to read before acting.

The `sessionId` ties the conversation to STM. For the same user working on the same feature with the same agent, the session ID is stable across days and weeks (STM events persist for the configured expiry duration, up to 365 days), so STM accumulates the full conversational context over time.

#### Agent Response with Artifacts

The agent's response separates conversational content from artifact outputs, following A2A's artifact model:

```json
{
  "jsonrpc": "2.0",
  "id": "req-abc-001",
  "result": {
    "id": "task-xyz-789",
    "sessionId": "session-auth-service-pm-user-jane-doe",
    "status": {
      "state": "completed"
    },
    "messages": [
      {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "I've added rate limiting requirements to section 4.1 of the PRD. I specified the 1000 req/min per-tenant limit with configurable burst allowance, and added error response requirements for when limits are exceeded."
          }
        ]
      }
    ],
    "artifacts": [
      {
        "name": "Auth Service PRD",
        "description": "Updated PRD with rate limiting requirements",
        "parts": [
          {
            "type": "data",
            "data": {
              "artifact_id": "prd-auth",
              "action": "updated",
              "artifact_type": "prd",
              "title": "Auth Service PRD",
              "version": 5,
              "previous_version": 4,
              "section_changed": "4.1",
              "change_summary": "Added rate limiting requirements: 1000 req/min per tenant with configurable burst allowance",
              "content": "...full updated document content..."
            }
          }
        ]
      }
    ]
  }
}
```

The `messages` array contains what gets rendered as chat bubbles. The `artifacts` array contains what gets rendered as inline cards and persisted to Postgres. This separation is native to the A2A protocol — the Lambda does not need to parse conversational text to find artifact boundaries.

#### Streaming with tasks/sendSubscribe

For real-time streaming of the agent's conversational output, the Lambda uses `tasks/sendSubscribe` instead of `tasks/send`. This returns a stream of Server-Sent Events:

```json
{
  "jsonrpc": "2.0",
  "id": "req-abc-002",
  "method": "tasks/sendSubscribe",
  "params": {
    "id": "task-xyz-789",
    "sessionId": "session-auth-service-pm-user-jane-doe",
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Create user stories for all uncovered PRD requirements."
        }
      ]
    }
  }
}
```

The stream produces events in order:

First, status updates as the agent begins working:

```json
{
  "jsonrpc": "2.0",
  "method": "tasks/status",
  "params": {
    "id": "task-xyz-789",
    "status": { "state": "working" },
    "final": false
  }
}
```

Then, conversational content streams as message parts:

```json
{
  "jsonrpc": "2.0",
  "method": "tasks/status",
  "params": {
    "id": "task-xyz-789",
    "status": {
      "state": "working",
      "message": {
        "role": "agent",
        "parts": [
          {
            "type": "text",
            "text": "I'm reviewing the PRD against existing stories to identify gaps..."
          }
        ]
      }
    },
    "final": false
  }
}
```

Artifact events arrive as they are produced:

```json
{
  "jsonrpc": "2.0",
  "method": "tasks/artifact",
  "params": {
    "id": "task-xyz-789",
    "artifact": {
      "name": "SSO/SAML Integration",
      "parts": [
        {
          "type": "data",
          "data": {
            "artifact_id": "us-4",
            "action": "created",
            "artifact_type": "user_story",
            "title": "SSO/SAML Integration",
            "version": 1,
            "content": "...story content..."
          }
        }
      ]
    }
  }
}
```

The frontend receives these events via WebSocket from the Lambda and renders them incrementally — chat text streams in character by character, and artifact cards appear the moment the artifact event arrives, with the feature tree updating in real-time.

The final event closes the stream:

```json
{
  "jsonrpc": "2.0",
  "method": "tasks/status",
  "params": {
    "id": "task-xyz-789",
    "status": { "state": "completed" },
    "final": true
  }
}
```

### Tool Execution Model

The Strands agents define tools for artifact operations. The tools execute in the Lambda, not in the AgentCore runtime. The agent produces tool call intents, and the Lambda intercepts and executes them against Postgres.

#### Tool Definitions

Each agent has access to the following tools. The Lambda injects the `node_id` into every tool execution — the agent never specifies it.

**Shared tools (all agents):**

`get_artifact` — Retrieve an artifact's full content by ID. Accepts an optional version parameter. Returns the content, metadata, version, and status. The agent should call this before updating any artifact to ensure it is working with the latest content.

`list_artifacts` — List all artifacts under the current feature node. Accepts an optional artifact type filter. Returns artifact IDs, types, titles, versions, and statuses. Scoped to the current node automatically.

`get_artifact_diff` — Get the textual diff between two versions of an artifact. Accepts artifact ID, from version, and optional to version (defaults to latest).

`get_sibling_artifacts` — List artifacts from sibling feature nodes. Useful for checking consistency across related features. Accepts an optional artifact type filter.

`get_parent_artifacts` — List artifacts from the parent feature node. Useful for inheriting context from a parent feature.

**Product Manager tools:**

`save_artifact` — Create or update a discovery doc, PRD, or user story. If artifact ID is provided, creates a new version. If not, creates a new artifact. Accepts: artifact type, title, content, change summary, optional section identifier.

`promote_artifact` — Change an artifact's status (draft → review → approved). Only the owning agent can promote its own artifact types.

**Architect tools:**

`save_artifact` — Same interface, restricted to technical spec, system design, and integration plan types.

`promote_artifact` — Same interface, restricted to Architect-owned types.

`flag_concern` — Create a structured concern linked to a specific artifact and section. Visible to all agents. Used when the Architect identifies a feasibility issue with a PM artifact.

**Lead Engineer tools:**

`save_artifact` — Same interface, restricted to implementation plan, task breakdown, and test plan types.

`promote_artifact` — Same interface, restricted to Lead Engineer-owned types.

`estimate_effort` — Attach effort estimates to user stories or task breakdowns. Stored as metadata on the artifact version.

`flag_concern` — Same as Architect. Used when the Lead Engineer identifies an implementation concern.

#### Tool Execution Flow

When the Strands agent produces a tool call, the following happens:

1. AgentCore returns the tool call intent to the Lambda as part of the agent response.
2. The Lambda parses the tool call name and arguments.
3. The Lambda injects `node_id` from the session context.
4. The Lambda validates that the calling agent type is permitted to execute this tool with these artifact types.
5. The Lambda executes the tool against Postgres within a transaction.
6. For `save_artifact`, the Lambda writes to both `artifact_versions` and `conversation_artifact_refs`.
7. The Lambda returns the tool result to the agent for continued reasoning, or includes it in the final response if the agent is done.

This model keeps the agent runtime stateless and pure — it reasons and decides — while the Lambda handles all persistence and authorization.

### Multi-Agent Task Flow

For complex PDLC workflows, the agents work sequentially on the same feature node. The Lambda manages the handoff context.

#### Example: Full PDLC Flow for a Feature

**Phase 1: Discovery (Product Manager)**

The user chats with the PM agent under the Auth Service node. The PM creates a discovery document exploring the problem space, target users, and success metrics. The user iterates on it over several turns. When satisfied, the user tells the PM to mark it as approved.

The PM calls `promote_artifact("disc-auth", "approved")`. The feature tree shows the discovery doc with a checkmark.

**Phase 2: Requirements (Product Manager)**

The user stays with the PM agent and says "start the PRD." The PM calls `get_artifact("disc-auth")` to read the approved discovery doc, then calls `save_artifact(type="prd", ...)` to create a PRD seeded from the discovery findings. The user iterates on the PRD over multiple sessions. LTM carries forward context between sessions.

Once the PRD is stable, the PM creates user stories by reading the PRD's functional requirements and calling `save_artifact(type="user_story", ...)` for each story.

**Phase 3: Architecture (Architect)**

The user switches to the Architect agent. The Lambda assembles a handoff context:

```json
{
  "type": "agent_handoff",
  "from_agent": "product-manager",
  "summary": "Discovery (v2, approved) and PRD (v6, approved) are complete. 5 user stories exist in draft. Key requirements: OAuth2 with PKCE, MFA, session management, rate limiting at 1000 req/min per tenant, SSO/SAML for enterprise.",
  "artifacts_available": ["disc-auth", "prd-auth", "us-1", "us-2", "us-3", "us-4", "us-5"]
}
```

This handoff is injected as a data part in the first message to the Architect. The Architect reads the PRD and user stories via `get_artifact` calls, then produces a technical specification and system design document.

If the Architect identifies a feasibility concern — for example, that the rate limiting requirement conflicts with the expected latency SLA — it calls `flag_concern(artifact_id="prd-auth", section="4.1", concern="Rate limiting at the API gateway level may add 15-20ms latency, conflicting with the 50ms p99 target in section 4.3.")`. This concern is visible to the PM and stored in the database.

**Phase 4: Implementation Planning (Lead Engineer)**

The user switches to the Lead Engineer. Another handoff context is assembled, now including the Architect's artifacts. The Lead Engineer reads the technical spec and user stories, produces an implementation plan with task breakdowns, effort estimates, and a test plan.

The Lead Engineer can call `estimate_effort(artifact_id="us-1", estimate={points: 5, confidence: "high", notes: "Straightforward OAuth2 PKCE implementation using existing library"})` to attach estimates to stories.

#### Cross-Agent Artifact References

All three agents can read any artifact under the current node (and sibling/parent nodes). This allows natural cross-referencing.

When the Architect is writing a technical spec, it might reference a user story: "As specified in US-3 (MFA Enrollment), the system must support TOTP and WebAuthn." The `conversation_artifact_refs` table captures these read references with action type "referenced", creating a dependency graph across agent boundaries.

### Lambda Request/Response Structure

The Lambda receives requests from the frontend and translates them to A2A JSON-RPC calls. Here is the full flow for a single user turn.

#### Frontend Request to Lambda

```json
{
  "action": "send_message",
  "node_id": "auth-service",
  "agent_type": "product-manager",
  "session_id": "session-auth-service-pm-user-jane-doe",
  "actor_id": "user-jane-doe",
  "message": "Add rate limiting requirements to the PRD."
}
```

#### Lambda Processing

The Lambda performs the following steps:

1. Query Postgres for the feature node and its child artifacts to build the tree context.
2. Query Postgres for any active concerns flagged by other agents on this node's artifacts.
3. Resolve the agent endpoint from the agent type (PM, Architect, or Lead Engineer).
4. Construct the A2A JSON-RPC `tasks/sendSubscribe` request with tree context, concerns, and user message.
5. Open the SSE stream from AgentCore.
6. For each streamed event, forward conversational content to the frontend via WebSocket.
7. For each tool call the agent makes, execute it against Postgres and return the result to the agent.
8. For each artifact event in the final response, persist to Postgres and forward the structured event to the frontend.
9. Write to `conversation_artifact_refs` for every artifact the agent created, updated, or referenced.

#### Lambda Response to Frontend

```json
{
  "messages": [
    {
      "role": "agent",
      "agent_type": "product-manager",
      "content": "I've added rate limiting requirements to section 4.1 of the PRD. I specified the 1000 req/min per-tenant limit with configurable burst allowance, and added error response codes for 429 scenarios.",
      "timestamp": "2026-02-27T14:32:15Z"
    }
  ],
  "artifact_events": [
    {
      "artifact_id": "prd-auth",
      "action": "updated",
      "artifact_type": "prd",
      "title": "Auth Service PRD",
      "version": 5,
      "previous_version": 4,
      "section_changed": "4.1",
      "change_summary": "Added rate limiting requirements",
      "node_id": "auth-service"
    }
  ],
  "tree_updates": [
    {
      "node_id": "auth-service",
      "child_id": "prd-auth",
      "version": 5,
      "status": "draft"
    }
  ],
  "suggested_actions": [
    {
      "label": "Review with Architect",
      "action": "switch_agent",
      "target_agent": "architect",
      "prefill": "Review the rate limiting requirements I just added to the PRD for technical feasibility."
    },
    {
      "label": "Create rate limit user story",
      "action": "send_message",
      "prefill": "Create a user story for rate limit error handling from the API consumer's perspective."
    }
  ]
}
```

The frontend uses `messages` for chat bubbles, `artifact_events` for inline cards, `tree_updates` to animate the sidebar, and `suggested_actions` for quick-action buttons.

### AgentCore Memory Integration

#### Short-Term Memory (STM)

Each agent-feature-node combination has its own session. STM maintains conversational continuity within that session. The session ID follows a deterministic pattern:

`session-{node_id}-{agent_type}-{actor_id}`

This ensures that the same user working on the same feature with the same agent always resumes the same session, regardless of when they return.

**Important distinction: AgentCore Runtime container persistence vs. AgentCore Memory STM.** The AgentCore Runtime microVM keeps in-process memory for up to 8 hours or 15 minutes of inactivity — this is the container lifecycle, not the Memory service. When the container recycles, in-process state is lost. However, AgentCore Memory STM is a durable storage layer independent of the runtime container. When creating a Memory resource, you configure an event expiry duration of up to 365 days via the `--event-expiry-days` parameter. Raw conversation events (full turn-by-turn history) persist in STM for the configured duration and are retrievable at any time within that window.

For this system, configure STM with a generous expiry (90–180 days). This means a user can leave a conversation with the PM agent on the Auth Service feature, come back two weeks later, and STM still has the full history. The agent retrieves prior turns via `get_last_k_turns` and resumes seamlessly — no manual history injection needed.

Because STM is durable and long-lived, the session ID does not need a date component to force daily rotation. A single stable session per user-node-agent combination is sufficient. If a user explicitly wants to start a fresh conversation on the same feature (rare but possible), the frontend can offer a "New Conversation" action that generates a new session ID.

#### Long-Term Memory (LTM)

LTM is configured with three strategies:

**Semantic Memory** — Namespaced to `/features/{actorId}/facts`. Extracts factual information about artifacts: what exists, what version they are on, what key requirements or decisions are captured in them. This allows the agent to recall "the PRD has rate limiting in section 4.1" without calling `get_artifact` on every new session.

**Summary Memory** — Namespaced to `/features/{actorId}/{sessionId}/summary`. Generates end-of-session summaries like "In this session, the user finalized the PRD's non-functional requirements and created three user stories covering login, password reset, and MFA enrollment." These summaries power the handoff context when switching agents.

**User Preference Memory** — Namespaced to `/users/{actorId}/preferences`. Captures authoring preferences: "This user prefers detailed acceptance criteria with Given/When/Then format," "This user wants PRDs to include a risk assessment section," "This user prefers concise discovery docs focused on problem validation."

When the Lambda invokes an agent, it configures retrieval to pull from all three:

```python
retrieval_config = {
    "/features/{actorId}/facts": RetrievalConfig(top_k=15, relevance_score=0.3),
    "/features/{actorId}/{sessionId}/summary": RetrievalConfig(top_k=3, relevance_score=0.5),
    "/users/{actorId}/preferences": RetrievalConfig(top_k=5, relevance_score=0.7)
}
```

LTM is a recall accelerator. It tells the agent what to look for. Postgres tools give the agent what the artifacts actually say. The agent should always `get_artifact` from Postgres before modifying a document, even if LTM suggests it knows the content.

LTM extraction is asynchronous. Newly created artifacts may not be reflected in LTM for several seconds. The tree context injection from the Lambda (which queries Postgres directly) serves as the ground truth to cover this latency gap.

### Error Handling in JSON-RPC

All errors follow JSON-RPC 2.0 error codes.

For agent invocation failures:

```json
{
  "jsonrpc": "2.0",
  "id": "req-abc-001",
  "error": {
    "code": -32603,
    "message": "Agent invocation failed",
    "data": {
      "agent_type": "product-manager",
      "reason": "AgentCore timeout after 30s"
    }
  }
}
```

For tool execution failures (artifact not found, permission denied):

```json
{
  "jsonrpc": "2.0",
  "id": "req-abc-001",
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "tool": "save_artifact",
      "reason": "Architect agent cannot create artifacts of type 'user_story'"
    }
  }
}
```

For task state errors (task already completed, invalid session):

```json
{
  "jsonrpc": "2.0",
  "id": "req-abc-001",
  "error": {
    "code": -32600,
    "message": "Invalid request",
    "data": {
      "reason": "Task task-xyz-789 is already in completed state"
    }
  }
}
```

The Lambda translates these into user-friendly error messages for the frontend and includes retry guidance where appropriate.

### Concern and Feedback Loop

The `flag_concern` tool creates a bidirectional feedback channel between agents. When the Architect flags a concern on a PM artifact, it is stored in Postgres and surfaced to the PM the next time they interact with that feature node.

The concern appears in the PM's tree context injection:

```json
{
  "type": "active_concerns",
  "concerns": [
    {
      "concern_id": "concern-001",
      "flagged_by": "architect",
      "artifact_id": "prd-auth",
      "section": "4.1",
      "concern": "Rate limiting at the API gateway level may add 15-20ms latency, conflicting with the 50ms p99 target in section 4.3.",
      "status": "open",
      "created_at": "2026-02-27T15:10:00Z"
    }
  ]
}
```

The PM agent sees this and can address it by updating the PRD (resolving the conflict) or by acknowledging the trade-off. Resolving a concern is explicit — the PM calls `resolve_concern("concern-001", resolution="Relaxed p99 target to 75ms in section 4.3 to accommodate gateway rate limiting.")`.

This creates a tracked feedback loop between agents without requiring them to share a conversation. Each agent operates in its own conversation context but can leave structured notes for the others.
