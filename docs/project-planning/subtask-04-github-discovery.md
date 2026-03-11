# Subtask 04: LLM-Driven Trending Discovery

**Owner:** AI/ML Engineer  
**Branch:** `feature/04-llm-discovery`  
**Estimated Time:** 4-5 hours  
**Dependencies:** Subtask 03

## Objective
Implement discovery that uses the LLM to research the last week of community activity and return up to 20 candidate GitHub repositories.

## Deliverables
- Define discovery types for repositories, sources, and options
- Create a structured discovery prompt that focuses on the last 7 days
- Implement `DiscoveryService` that returns a normalized candidate list
- Restrict discovery to **top 20 candidates max**
- Capture why each repository is trending and what sources were used
- Wire the discovery node into the agent graph

## Implementation Notes
- Prioritize GitHub Trending, Hacker News, Reddit, Dev.to, and relevant developer blogs
- Return structured JSON only from the model
- Validate GitHub URLs and normalize repository names
- Optimize prompts for focused discovery rather than exhaustive searching
- Do not add scheduler or background job behavior here

## Acceptance Criteria
- [ ] Discovery returns at most 20 candidates from the past week
- [ ] Each candidate includes URL, name, description, language, and `whyTrending`
- [ ] Invalid or malformed GitHub URLs are filtered out
- [ ] The discovery node populates `discoveredRepos` in the graph state
- [ ] Prompt size remains small and targeted
