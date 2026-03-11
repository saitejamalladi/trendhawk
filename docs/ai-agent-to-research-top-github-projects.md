# GitHub Trending Projects Research Agent

## Objective
Build a headless AI agent that is triggered on demand via API and produces 3 high-quality reports on trending GitHub repositories from the past week.

## Core Functionality

### On-Demand Research
Trigger via `POST /api/agent/report/generate`

1. **Discover** up to 20 candidate GitHub repositories from the past week using:
   - GitHub trending signals
   - Community discussions (Hacker News, Reddit, Dev.to)
   - Developer blogs and tech forums

2. **Filter** duplicates via RAG against existing reports in MongoDB

3. **Select** the best 3 unique repositories for report generation

4. **Generate** a report per repository (~1000 words) with sections:
   - **Overview**
   - **Key Features**
   - **Tech Stack**
   - **Community Health**
   - **Why Explore**
   - **Getting Started**

5. **Validate** output with guardrails:
   - No duplicate entries
   - Content length within bounds
   - Required sections present
   - URLs and repository references are valid

6. **Store** reports in MongoDB

## Tech Stack
| Component | Technology |
|-----------|------------|
| Runtime | Docker + docker-compose |
| Backend | NestJS + TypeScript |
| Database | MongoDB + Mongoose |
| AI/Agent | LangGraph + LangSmith |
| LLM | Gemini Flash by default, with provider-agnostic support |
| Deduplication | RAG with vector embeddings |

## MongoDB Schema

```typescript
interface TrendingResource {
  _id: ObjectId;
  resourceType: 'github_repo' | 'npm_package';
  name: string;
  url: string;
  metadata: {
    stars?: number;
    forks?: number;
    language?: string;
    downloads?: number;
    weeklyDownloads?: number;
  };
  content: string;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Architecture

```text
API Trigger -> LangGraph Agent -> MongoDB
                     |
                     -> LLM Provider
```

## Agent Flow

```text
START -> SearchTrendingTop20 -> FilterDuplicates -> SelectTop3 -> GenerateReports -> ValidateOutput -> SaveToMongo -> END
```

## Constraints
- On-demand execution only; no scheduler required
- Discovery should stay focused on the top 20 candidate repositories from the past week
- No frontend required
- Keep prompts structured and token-efficient
