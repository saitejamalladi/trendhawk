# Subtask 05: RAG-Based Deduplication System

**Owner:** AI/ML Engineer  
**Branch:** `feature/05-rag-deduplication`  
**Estimated Time:** 6-8 hours  
**Dependencies:** Subtasks 02, 03, 04

## Objective
Filter the discovered candidates against historical reports and the current batch so only the best unique repositories move forward.

## Deliverables
- Add an embedding factory aligned with the active LLM provider
- Implement an embedding service for single and batch embedding generation
- Add similarity utilities for semantic and string-based comparison
- Implement a deduplication service that checks:
  - exact URL matches
  - semantic similarity against stored reports
  - obvious duplicates within the current candidate batch
- Select the top 3 unique repositories after deduplication
- Update the agent graph filter node to persist duplicate reasoning in logs or state

## Implementation Notes
- Keep thresholds configurable
- Prefer exact URL matching before embedding work
- Use embeddings only where they provide value; avoid unnecessary model calls
- Keep the output deterministic enough for later report generation

## Acceptance Criteria
- [ ] Historical duplicate reports are excluded
- [ ] Current-run duplicates are excluded
- [ ] The filter step reduces the candidate list to at most 3 repositories
- [ ] Deduplication is compatible with stored embeddings in MongoDB
- [ ] Failure handling has a safe fallback path
