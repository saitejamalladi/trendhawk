# TrendHawk Implementation Plan

## Project Overview

TrendHawk is a headless, on-demand AI agent that discovers trending GitHub repositories from the past week and generates 3 stored reports per run.

## Scope
- Trigger report generation via API
- Discover up to 20 candidate repositories using web-grounded research
- Deduplicate against existing reports in MongoDB
- Generate and validate 3 final reports
- Expose reports through REST endpoints
- Run locally and in deployment via Docker

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/agent/report/generate` | Run the agent on demand |
| GET | `/api/reports` | List reports |
| GET | `/api/reports/:id` | Get one report |

## Key Decisions
- The system is **on-demand only**; no scheduler is required.
- Discovery should fetch **at most 20 candidate repositories** from the last week.
- After deduplication, the system should generate reports for the **best 3 unique repositories**.
- LLM access should remain **provider-agnostic**.

## Implementation Roadmap

### Phase 1: Foundation

| Subtask | Description | Doc |
|---------|-------------|-----|
| 01 | Project scaffolding and core configuration | [subtask-01-project-scaffolding.md](subtask-01-project-scaffolding.md) |
| 02 | MongoDB setup and report persistence | [subtask-02-database-setup.md](subtask-02-database-setup.md) |

### Phase 2: AI Core

| Subtask | Description | Doc |
|---------|-------------|-----|
| 03 | LangGraph agent core and provider-agnostic LLM setup | [subtask-03-langgraph-agent-core.md](subtask-03-langgraph-agent-core.md) |
| 04 | Trending discovery for top 20 candidates | [subtask-04-github-discovery.md](subtask-04-github-discovery.md) |
| 05 | RAG-based deduplication and top-3 selection | [subtask-05-rag-deduplication.md](subtask-05-rag-deduplication.md) |
| 06 | Report generation, validation, and persistence flow | [subtask-06-report-generation.md](subtask-06-report-generation.md) |

### Phase 3: Deployment

| Subtask | Description | Doc |
|---------|-------------|-----|
| 07 | Docker deployment and runtime health checks | [subtask-07-docker-deployment.md](subtask-07-docker-deployment.md) |

### Phase 4: Documentation

| Subtask | Description | Doc |
|---------|-------------|-----|
| 08 | Project and API documentation | [subtask-08-documentation.md](subtask-08-documentation.md) |

## Team Assignment Matrix

| Role | Subtasks |
|------|----------|
| Backend Developer | 01, 02 |
| AI/ML Engineer | 03, 04, 05, 06 |
| DevOps Engineer | 07 |
| Technical Writer | 08 |

## Success Criteria

### Functional
- [ ] Agent can be triggered through the API
- [ ] Discovery returns up to 20 recent candidate repositories
- [ ] Deduplication removes prior coverage and current-run duplicates
- [ ] Exactly 3 final reports are generated when enough unique candidates exist
- [ ] Reports are saved and retrievable through the API

### Non-Functional
- [ ] Prompt design stays token-efficient
- [ ] Docker-based local run works
- [ ] Documentation is sufficient for setup and usage
