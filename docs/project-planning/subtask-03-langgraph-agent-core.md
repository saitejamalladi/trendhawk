# Subtask 03: LangGraph AI Agent Core Setup

**Owner:** AI/ML Engineer  
**Branch:** `feature/03-langgraph-agent-core`  
**Estimated Time:** 6-8 hours  
**Dependencies:** Subtask 01

## Objective
Create the reusable agent foundation: LLM factory, LangSmith integration, shared agent state, and the initial LangGraph flow.

## Deliverables
- Implement a provider-agnostic `LlmFactory` supporting Google, OpenAI, and Anthropic
- Add optional LangSmith tracing support
- Define agent types and LangGraph state annotations
- Build the graph skeleton with these stages:
  - `discoverTrending`
  - `filterDuplicates`
  - `generateReports`
  - `validateOutput`
  - `saveToMongo`
  - `handleError`
- Add `AgentService` and the `POST /api/agent/report/generate` controller endpoint

## Implementation Notes
- Keep node logic lightweight in this subtask; real business logic lands in later subtasks
- Make retry routing explicit in the graph
- Fail fast when required LLM configuration is missing
- Keep provider switching controlled by environment variables only

## Acceptance Criteria
- [ ] LLM provider can be switched by config
- [ ] LangGraph compiles with placeholder nodes
- [ ] Agent state supports repos, reports, validation results, and errors
- [ ] Retry routing is defined
- [ ] The API endpoint can invoke the graph successfully
