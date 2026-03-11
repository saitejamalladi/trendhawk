# Subtask 06: Report Generation & Validation Pipeline

**Owner:** AI/ML Engineer  
**Branch:** `feature/06-report-generation`  
**Estimated Time:** 8-10 hours  
**Dependencies:** Subtasks 02, 03, 05

## Objective
Generate the final repository reports, validate them, and persist only valid results.

## Deliverables
- Create structured prompts for report generation and report validation
- Implement a report generation service for the selected repositories
- Validate generated output for required sections, formatting, and basic factual consistency
- Save only valid reports to MongoDB
- Store embeddings for saved reports to support future deduplication
- Complete the final agent graph flow from generation to persistence

## Implementation Notes
- Generate reports only for the final filtered repositories
- Keep prompts concise and reuse shared context fields
- Validate required sections before persistence
- Bound output length to the desired range instead of allowing verbose outputs
- Ensure saved report metadata matches the repo being written

## Acceptance Criteria
- [ ] Reports are generated for the selected repositories only
- [ ] Each report includes the required sections
- [ ] Validation blocks malformed or incomplete reports
- [ ] Valid reports are saved to MongoDB
- [ ] Saved reports can be retrieved through the reports API
