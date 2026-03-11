# Subtask 02: MongoDB Database Setup & Schema

**Owner:** Backend Developer  
**Branch:** `feature/02-database-setup`  
**Estimated Time:** 3-4 hours  
**Dependencies:** Subtask 01

## Objective
Add MongoDB persistence for generated reports and expose the minimal report retrieval APIs.

## Deliverables
- Configure Mongoose connection in the application root
- Create the `TrendingResource` schema with timestamps and indexes
- Implement a `ReportModule` with repository and service layers
- Expose read endpoints for listing reports and fetching a single report
- Support storing embeddings for later deduplication

## Implementation Notes
- Optimize for the GitHub repository use case first
- Keep the data model extensible for future resource types
- Add indexes for `url`, recent retrieval, and text search where useful
- Keep CRUD surface minimal; only add what the agent flow needs

## Acceptance Criteria
- [ ] Application connects to MongoDB from configuration
- [ ] Reports can be created and read through the service layer
- [ ] Duplicate URLs are prevented at the database level
- [ ] Report listing and detail endpoints are available
- [ ] Embedding storage is supported for deduplication
