# TrendHawk

TrendHawk is a headless AI agent that discovers trending GitHub repositories from the past week and generates high-quality reports on demand.

The agent performs the following steps autonomously:
1.  **Discovers** up to 20 candidate repositories from recent community activity.
2.  **Filters** duplicates against previously stored reports to ensure fresh content.
3.  **Selects** the top 3 unique repositories based on relevance and quality.
4.  **Generates** structured reports for each selected repository.
5.  **Validates** the output structure and quality.
6.  **Stores** the final reports in MongoDB.

## Prerequisites

- **Node.js**: v20 or higher
- **Docker**: For containerized deployment
- **MongoDB**: v6.0+ (if running locally without Docker)
- **API Keys**: Access to OpenAI, Anthropic, or Google Generative AI (Gemini)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/trendhawk.git
    cd trendhawk
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Copy the example configuration file:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in your API keys (e.g., `OPENAI_API_KEY`). See the [Environment Variables](#environment-variables) section below for details.

## Running the Application

### Option 1: Run Locally (Development)

Ensure you have a local MongoDB instance running on `mongodb://localhost:27017/trendhawk` or update `MONGODB_URI` in `.env`.

```bash
# Start MongoDB (if using Docker for DB only)
docker run -d -p 27017:27017 --name mongo mongo:latest

# Run the application in watch mode
npm run start:dev
```

The server will start at `http://localhost:3000`.

### Option 2: Run with Docker (Production-like)

This will start both the application and a MongoDB container.

```bash
docker compose up --build
```

The server will be available at `http://localhost:3000`.

## API Reference

The API is prefixed with `/api`. An interactive Swagger documentation is available at:
**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Agent Endpoints

#### Trigger Report Generation
Triggers the full agent workflow to discover, filter, and generate reports.

- **URL:** `/api/agent/report/generate`
- **Method:** `POST`
- **Response:**
  ```json
  {
    "reportsGenerated": 3,
    "reports": [
      {
        "url": "https://github.com/owner/repo1",
        "name": "repo1"
      },
      ...
    ]
  }
  ```

### Report Endpoints

#### List Reports
Retrieve a paginated list of generated reports.

- **URL:** `/api/reports`
- **Method:** `GET`
- **Query Params:**
  - `limit` (default: 10)
  - `skip` (default: 0)
- **Response:**
  ```json
  {
    "data": [ ... ],
    "total": 50
  }
  ```

#### Get Report by ID
Retrieve a single report by its MongoDB ID.

- **URL:** `/api/reports/:id`
- **Method:** `GET`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port the application runs on. | `3000` |
| `NODE_ENV` | Environment mode (`development`, `production`). | `development` |
| `MONGODB_URI` | Connection string for MongoDB. | `mongodb://localhost:27017/trendhawk` |
| `LLM_PROVIDER` | The LLM provider to use (`openai`, `anthropic`, `google`). | `openai` |
| `OPENAI_API_KEY` | API key for OpenAI. | - |
| `OPENAI_MODEL` | Chat model for OpenAI. | `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | API key for Anthropic. | - |
| `ANTHROPIC_MODEL` | Chat model for Anthropic. | `claude-3-5-haiku-latest` |
| `GOOGLE_API_KEY` | API key for Google Gemini. | - |
| `GOOGLE_MODEL` | Chat model for Google. | `gemini-2.0-flash` |
| `LANGCHAIN_TRACING_V2` | Enable LangSmith tracing. | `false` |
| `LANGCHAIN_API_KEY` | API key for LangSmith. | - |
| `DEDUP_MAX_UNIQUE_REPOS` | Maximum number of unique repos to select. | `3` |
| `DEDUP_STRING_SIMILARITY_THRESHOLD` | Threshold for string similarity duplicate detection. | `0.92` |
| `DEDUP_SEMANTIC_SIMILARITY_THRESHOLD` | Threshold for semantic similarity duplicate detection. | `0.94` |

## Project Structure

```
src/
├── agent/       # LangGraph agent logic (nodes, state, flow)
├── dedup/       # Deduplication service (similarity search)
├── discovery/   # Repository discovery logic
├── llm/         # LLM factory and provider abstraction
├── report/      # Report generation, storage, and API
├── app.module.ts
└── main.ts
```

## Testing

Run the test suite:

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e
```
