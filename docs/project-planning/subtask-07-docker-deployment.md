# Subtask 07: Docker & Deployment

**Owner:** DevOps Engineer  
**Branch:** `feature/07-docker-deployment`  
**Estimated Time:** 6-8 hours  
**Dependencies:** Subtasks 01-06

## Objective
Package the application for reliable local and deployment usage with Docker.

## Deliverables
- Add a production-ready Dockerfile
- Add `docker-compose.yml` for local application + MongoDB startup
- Add health checks for the API and database
- Add a minimal `.dockerignore`
- Ensure environment variables are passed correctly into containers

## Implementation Notes
- Keep the container image small and production-oriented
- Use a separate MongoDB service in compose
- Do not duplicate documentation-heavy setup details in this file
- Prefer defaults that make local development simple

## Acceptance Criteria
- [ ] The app starts with Docker Compose
- [ ] MongoDB is reachable from the app container
- [ ] Health checks reflect application readiness
- [ ] Production image can run the built NestJS app
