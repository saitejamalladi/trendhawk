# Subtask 01: Project Scaffolding & Initial Setup

**Owner:** Backend Developer  
**Branch:** `feature/01-project-scaffolding`  
**Estimated Time:** 4-6 hours  
**Dependencies:** None

## Objective
Set up the base NestJS project structure so later AI and database work can be added without rework.

## Deliverables
- Initialize the NestJS project with strict TypeScript
- Add configuration loading through `@nestjs/config`
- Set up a clean module structure for `agent`, `discovery`, `llm`, and `report`
- Configure linting and formatting
- Add Swagger bootstrapping in `main.ts`
- Add a minimal `.env.example`

## Implementation Notes
- Keep the scaffold small; only install dependencies required by later subtasks
- Prefer a modular structure over early abstraction
- Make `ConfigModule` global
- Keep environment keys aligned with later LLM and MongoDB subtasks

## Acceptance Criteria
- [ ] NestJS app runs locally
- [ ] Strict TypeScript is enabled
- [ ] Shared configuration is available across modules
- [ ] Swagger is exposed at `/api/docs`
- [ ] `.env.example` documents required variables
