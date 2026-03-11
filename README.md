# TrendHawk

TrendHawk is a headless AI agent that discovers trending GitHub repositories from the past week and generates 3 high-quality reports on demand.

## What it does
- discovers up to 20 candidate repositories from recent community activity
- filters duplicates against previously stored reports
- selects the best 3 unique repositories
- generates and validates structured reports
- stores reports in MongoDB

## Planned stack
- NestJS
- TypeScript
- MongoDB + Mongoose
- LangGraph
- LangSmith
- Docker

## API
- `POST /api/agent/report/generate` — trigger report generation
- `GET /api/reports` — list reports
- `GET /api/reports/:id` — get one report

## Docs
Planning documents are under [docs/project-planning](docs/project-planning).

Primary requirement doc:
- [docs/ai-agent-to-research-top-github-projects.md](docs/ai-agent-to-research-top-github-projects.md)

## Status
The repository currently contains planning documents and implementation subtasks for the agent build-out.
