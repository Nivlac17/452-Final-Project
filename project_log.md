# Project Log

**Project:** CS 452 Final Project  
**Repository:** [Nivlac17/452-Final-Project](https://github.com/Nivlac17/452-Final-Project)  
**Target effort:** 30–40 hours

Use this log to record each project work session. Add a new entry whenever you work on the project, then commit and push the updated log with the rest of the project work. Record actual time spent; do not count this template as project implementation time.

## Work Sessions

### Session 1 — 2026-11-18 — Project log setup

- **Time spent:** Not recorded (log setup only; exclude from project effort)
- **Goals:** Create the project log and establish a consistent record for future sessions.
- **Work completed:** Added this project log and a reusable session format.
- **Decisions / notes:** Track the date, actual duration, completed work, decisions, blockers, and next steps for every session.
- **Next steps:** Add the project requirements and begin the first implementation or research session.

### Session 2 — 2026-11-18 — Setup and project brainstorming

- **Time spent:** 1 hour 10 minutes
- **Goals:** Review the final project requirements, organize the project workspace, and begin exploring possible project ideas.
- **Work completed:** Set up the project repository and log; reviewed the requirements to build something personally interesting that reads and writes data, use AI to improve the result, and spend 30–40 hours total. Began brainstorming possible ideas.
- **Files / features changed:** `project_log.md`
- **Decisions / notes:** The project idea is still open. Use upcoming conversations to bounce ideas around and narrow toward something motivating and feasible.
- **Blockers:** No project idea selected yet.
- **Next steps:** Continue brainstorming and compare ideas for personal interest, data read/write needs, useful AI contribution, and a realistic 30–40-hour scope.

### Session 3 — 2026-11-19 — Final project layout and initial design

- **Time spent:** 2 hours
- **Goals:** Design the final project layout, define the initial PersonaBuilder scope and data model, and document the system architecture and daily implementation goals.
- **Work completed:** Designed the final project layout and ERD. Created `initial_design.md` with the project purpose, first-release goals, ERD, proposed technologies, system flow, and a dated daily plan through the last scheduled day of class instruction.
- **Files / features changed:** `initial_design.md`, `project_log.md`
- **Decisions / notes:** Initial plan uses Next.js and Supabase (Auth, PostgreSQL with pgvector, private Storage), with `.txt` uploads and text Q&A as the first-release scope. Domain hosting still needs confirmation.
- **Blockers:** Hosting and routing setup for `calvinmerrell.com/PersonaBuilder` is not yet known.
- **Next steps:** Confirm the domain's existing host and create the application skeleton and Supabase project.

### Session 4 — 2026-11-19 — Refine initial design document

- **Time spent:** 0.1 hours (6 minutes)
- **Goals:** Simplify the initial design document as requested.
- **Work completed:** Removed the references and assumptions section from `initial_design.md`.
- **Files / features changed:** `initial_design.md`, `project_log.md`
- **Decisions / notes:** The design document keeps the project summary, diagrams, and implementation plan without the separate references section.
- **Blockers:** None.
- **Next steps:** Confirm the domain's existing host and begin application setup.

### Session 5 — 2026-11-23 — Build PersonaBuilder application foundation

- **Time spent:** 1 hour (estimated active project work)
- **Goals:** Start implementing the planned product and complete as much of the foundation as possible before connecting external accounts.
- **Work completed:** Scaffolded the Next.js app; built the sign-in entry screen, persona picker, persona create/edit pages, text upload UI, persona chat UI, and API routes for persona updates, text chunking/embedding, and source-grounded answers. Added the Supabase schema and owner-only row-level security/storage policies, configuration example, and setup guide. Confirmed lint, TypeScript, and Webpack production build succeed.
- **Files / features changed:** `web/`, `project_log.md`
- **Decisions / notes:** App is under `web/` and configured with `/PersonaBuilder` as its base path. Supabase and OpenAI credentials are intentionally not committed. The Supabase migration must be applied before live account/data flows can work.
- **Blockers:** Need a Supabase project URL and public key, an OpenAI API key, and the name/configuration of the current domain host to complete OAuth and deployment.
- **Next steps:** Create the Supabase project and apply `web/supabase/migrations/0001_initial_schema.sql`; configure Google OAuth; add local environment variables; identify hosting provider.

---

## Session Entry Template

Copy this section for each new work session and fill it in with the work completed.

### Session N — YYYY-MM-DD — Short description

- **Time spent:** X hours (actual)
- **Goals:**
- **Work completed:**
- **Files / features changed:**
- **Decisions / notes:**
- **Blockers:** None / describe
- **Next steps:**

---

## Effort Summary

| Measure | Total |
|---|---:|
| Recorded project work | 4 hours 16 minutes (4.27 hours) |
| Target | 30–40 hours |

Update the recorded total after each work session. Exclude administrative setup such as creating this log unless it is part of substantive project work.
