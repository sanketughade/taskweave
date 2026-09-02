# Requirements Document

## Introduction

Taskweave is a Kanban/Trello-like task management application built as a full-stack learning and portfolio project. The frontend is an Angular 21 application (standalone components, signals, CDK) with a fully custom UI system. The backend is an ASP.NET Core 9 Web API using **ADO.NET (Npgsql) with raw SQL** as its data-access strategy over a PostgreSQL database.

The primary objective of this project is twofold:

1. Deliver a solid, user-friendly, real-world collaborative task manager (workspaces, boards, Kanban, task details, AI assistance, real-time updates).
2. Demonstrate **senior-level backend engineering skills** across API design, raw SQL data access, authentication/authorization, real-time communication, background processing, cross-cutting concerns, testing, and delivery.

The application supports authentication via email/password and Google OAuth, drag-and-drop Kanban boards, a task detail slide-over panel, AI-powered task features via a server-side OpenAI proxy, and real-time collaboration via SignalR.

This document is organized into **phases** so that it functions both as a project specification and as an implementation roadmap. Each requirement lists its acceptance criteria in EARS format and a short "Skills exercised" note tying it back to the senior-level topic it demonstrates.

## Technology Stack

| Concern | Technology |
| --- | --- |
| Frontend | Angular 21 (standalone components, signals, CDK DragDrop, custom UI system) |
| Backend | ASP.NET Core 9 Web API |
| Data access | ADO.NET via Npgsql, raw parameterized SQL (Dapper permitted only as a thin mapper where noted) |
| Database | PostgreSQL 16+ |
| Schema versioning | Versioned SQL migration scripts run via a migration runner (DbUp or FluentMigrator) |
| Authentication | ASP.NET Core authentication, JWT access tokens + rotating refresh tokens, Google OAuth (OpenID Connect) |
| Authorization | Role-based + policy-based + resource-based authorization handlers |
| Real-time | SignalR |
| Validation | FluentValidation |
| Logging | Serilog (structured logs, correlation IDs) |
| API docs | OpenAPI / Swagger |
| AI | OpenAI API called server-side through the Web API |
| Background work | ASP.NET Core BackgroundService / hosted services |
| Testing | xUnit, Moq/NSubstitute, WebApplicationFactory, Testcontainers for PostgreSQL |
| Delivery | Docker + docker-compose (API + PostgreSQL) |

## Glossary

- **App**: The Taskweave Angular frontend application.
- **API**: The ASP.NET Core Web API backend.
- **DAL**: Data Access Layer implemented with ADO.NET/Npgsql and raw SQL.
- **Repository**: A class encapsulating raw SQL data access for an aggregate (e.g., BoardRepository).
- **Unit_of_Work**: A coordinator that shares a single Npgsql connection/transaction across repositories for an operation.
- **DTO**: Data Transfer Object exchanged over the API boundary.
- **Auth_Service**: Backend service managing registration, sign-in, JWT issuance, refresh-token rotation, and OAuth.
- **JWT**: Signed JSON Web Token used as the access token.
- **Refresh_Token**: A long-lived, rotated, revocable token used to obtain new access tokens.
- **Auth_Policy**: A named ASP.NET Core authorization policy (e.g., WorkspaceAdmin).
- **Resource_Handler**: An authorization handler evaluating access to a specific resource instance (replacing Supabase RLS).
- **Hub**: A SignalR hub broadcasting real-time updates to connected clients.
- **AI_Proxy**: The backend endpoint/service that validates requests and calls OpenAI on the client's behalf.
- **Migration_Runner**: The tool executing versioned SQL scripts to create/evolve the schema.
- **Workspace**: A top-level organizational unit containing boards and members.
- **Board**: A Kanban board containing columns and task cards within a workspace.
- **Column**: A vertical list within a board representing a workflow stage.
- **Task_Card**: An individual work item within a column.
- **Subtask**: A checklist item belonging to a Task_Card.
- **Label**: A color-coded tag applied to Task_Cards.
- **Activity**: An audit entry recording a change to a workspace, board, or task.

## Architecture Overview

The solution SHALL follow a layered (Clean-Architecture-inspired) structure:

- **Taskweave.Api** — controllers, middleware, filters, SignalR hubs, DI composition, Swagger, configuration.
- **Taskweave.Application** — use-case services, DTOs, validation, authorization policy definitions, interfaces.
- **Taskweave.Domain** — entities, value objects, domain rules, enums.
- **Taskweave.Infrastructure** — ADO.NET repositories, Unit_of_Work, Npgsql connection factory, SQL scripts, external integrations (OpenAI, email, storage).
- **Taskweave.Tests** — unit and integration tests.

Request flow: `Angular 21  →  ASP.NET Core Web API (controllers → application services → repositories/ADO.NET)  →  PostgreSQL`, with SignalR for server-push and the AI_Proxy for OpenAI calls.

## Phase 0: Frontend Foundation and Design System (Completed)

**User Story:** As a developer, I want a consistent custom UI system and theming in place, so that all feature work builds on a cohesive, accessible foundation without external component libraries.

#### Acceptance Criteria

1. THE App SHALL provide a `twButton` directive supporting variants (primary, secondary, danger, ghost) and sizes (sm, md, lg).
2. THE App SHALL provide a `twInput` directive with consistent styling, validation states, and accessibility attributes (aria-label, aria-invalid).
3. THE App SHALL provide a `twBadge` directive supporting color variants for priority levels and labels.
4. THE App SHALL provide a `twLoading` directive that renders a spinner overlay for containers and inline spinner state for buttons.
5. THE App SHALL provide reusable components including spinner and empty-state, with additional shared components (modal, dropdown, avatar, toast, confirm-dialog, tooltip) to be completed as their consuming features are built.
6. THE App SHALL implement a theming system (dark/light/system) using CSS custom properties applied without a page reload, with the preference persisted in localStorage and applied on initial load.
7. THE App SHALL organize global styles into tokens, reset, typography, theme, utilities, and per-component stylesheets.

**Skills exercised:** Angular standalone components, directives, signals, `ViewEncapsulation`, CSS architecture, theming, accessibility fundamentals.

> Status note: The button, input, badge, loading, spinner, empty-state, and theming pieces exist in `src/app`. Remaining shared components are delivered alongside the features that first require them in later phases.

## Phase 1: Backend Foundation

### Requirement 1.1: Solution Structure and Dependency Injection

**User Story:** As a developer, I want a layered solution with clean dependency boundaries, so that the codebase is maintainable and testable.

#### Acceptance Criteria

1. THE API SHALL be organized into Api, Application, Domain, and Infrastructure projects with dependencies pointing inward (Api → Application → Domain; Infrastructure → Application/Domain).
2. THE API SHALL register all services via dependency injection with correct lifetimes (scoped for per-request services and repositories, singleton for stateless helpers, transient where appropriate).
3. THE Domain project SHALL NOT reference any infrastructure or framework packages beyond the base runtime.

**Skills exercised:** Clean/layered architecture, DI, service lifetimes, project boundaries.

### Requirement 1.2: Configuration and Secrets

**User Story:** As a developer, I want environment-aware configuration and safe secret handling, so that the app runs correctly across environments without leaking credentials.

#### Acceptance Criteria

1. THE API SHALL load configuration from appsettings.json, environment-specific overrides, environment variables, and user-secrets in development.
2. THE API SHALL bind configuration sections to strongly-typed options classes using the Options pattern.
3. THE API SHALL source all secrets (database connection string, JWT signing key, OpenAI key, OAuth client secret) from environment variables or user-secrets, never from committed files.

**Skills exercised:** Configuration providers, Options pattern, secrets management.

### Requirement 1.3: API Documentation and Versioning

**User Story:** As an API consumer, I want versioned, documented endpoints, so that I can integrate reliably and understand the contract.

#### Acceptance Criteria

1. THE API SHALL expose an OpenAPI/Swagger UI documenting all endpoints, request/response schemas, and auth requirements in non-production environments.
2. THE API SHALL implement API versioning (URL segment `/api/v1/...`) and route all endpoints under a version.
3. THE Swagger document SHALL include a security scheme allowing Bearer token authorization for protected endpoints.

**Skills exercised:** OpenAPI/Swagger, API versioning, REST contract design.

### Requirement 1.4: Global Exception Handling and Logging

**User Story:** As a developer and operator, I want consistent error responses and structured logs, so that failures are diagnosable and clients receive predictable errors.

#### Acceptance Criteria

1. THE API SHALL implement global exception-handling middleware that converts unhandled exceptions into RFC 7807 ProblemDetails responses with appropriate HTTP status codes.
2. THE API SHALL use Serilog for structured logging with a correlation/request ID attached to every log entry for a request.
3. WHEN a domain validation or authorization failure occurs, THE API SHALL return a structured error (400/403/404/409 as appropriate) without leaking stack traces in production.
4. THE API SHALL log request/response metadata (method, path, status, duration, correlation ID) for every request.

**Skills exercised:** Custom middleware, ProblemDetails, structured logging, correlation IDs, error normalization.

### Requirement 1.5: Health Checks and Containerization

**User Story:** As an operator, I want health checks and a reproducible runtime, so that the system can be monitored and run consistently.

#### Acceptance Criteria

1. THE API SHALL expose a `/health` endpoint reporting liveness and a `/health/ready` endpoint verifying database connectivity.
2. THE project SHALL provide a Dockerfile for the API and a docker-compose file that starts the API and a PostgreSQL instance together.
3. WHEN the containers start, THE Migration_Runner SHALL apply pending schema scripts before the API begins serving requests.

**Skills exercised:** Health checks, Docker, docker-compose, startup orchestration.

## Phase 2: Data Layer and Domain (ADO.NET + PostgreSQL)

### Requirement 2.1: Database Schema and Versioned Migrations

**User Story:** As a developer, I want a well-designed, version-controlled PostgreSQL schema, so that the data model is correct, evolvable, and reproducible.

#### Acceptance Criteria

1. THE database schema SHALL include tables for: users, profiles, refresh_tokens, workspaces, workspace_members, invitations, boards, board_members, columns, tasks, labels, task_labels, task_assignees, subtasks, comments, activities, notifications, favorites.
2. THE schema SHALL enforce referential integrity with foreign keys and use appropriate constraints (NOT NULL, UNIQUE, CHECK) and enum-like constraints for roles, priorities, and statuses.
3. THE schema SHALL be created and evolved exclusively through versioned SQL scripts executed by the Migration_Runner; no schema changes SHALL be made manually.
4. THE schema SHALL define indexes appropriate to query patterns, including B-tree indexes on foreign keys and sort columns, a GIN index for full-text search, and partial indexes where they benefit filtered queries.
5. WHERE ordered lists exist (columns within a board, tasks within a column, subtasks within a task), THE schema SHALL store an explicit position value to support drag-and-drop ordering.

**Skills exercised:** Relational schema design, normalization, constraints, indexing strategy (B-tree/GIN/partial), migration tooling.

### Requirement 2.2: ADO.NET Data Access Layer

**User Story:** As a developer, I want a raw-SQL data access layer, so that I demonstrate deep SQL and ADO.NET proficiency and retain full control over queries.

#### Acceptance Criteria

1. THE Infrastructure layer SHALL implement all data access using Npgsql `NpgsqlConnection`, `NpgsqlCommand`, parameters, and data readers with raw parameterized SQL.
2. THE DAL SHALL use parameterized queries exclusively; string concatenation of user input into SQL SHALL NOT occur under any circumstance.
3. THE DAL SHALL expose repository classes per aggregate (e.g., WorkspaceRepository, BoardRepository, TaskRepository) behind interfaces defined in the Application layer.
4. THE DAL SHALL provide a Unit_of_Work that shares a single connection and transaction across repositories participating in a multi-statement operation.
5. THE DAL SHALL manage connections through a connection factory relying on Npgsql connection pooling, and SHALL dispose connections/commands deterministically.
6. THE DAL SHALL implement all I/O asynchronously and honor CancellationToken on every database call.

**Skills exercised:** ADO.NET/Npgsql, parameterized SQL, repository + Unit of Work patterns, connection pooling, async I/O, cancellation.

### Requirement 2.3: Transactions and Concurrency

**User Story:** As a developer, I want correct transactional behavior and concurrency control, so that multi-step operations stay consistent under concurrent use.

#### Acceptance Criteria

1. WHEN an operation spans multiple statements that must succeed or fail together (e.g., reordering a list, deleting a board with its children), THE DAL SHALL execute them within a single database transaction and roll back on failure.
2. THE DAL SHALL use an appropriate isolation level for operations sensitive to concurrent modification and SHALL document the choice.
3. WHERE concurrent edits to the same record are possible (e.g., task detail auto-save), THE API SHALL implement optimistic concurrency using a version/row-version or updated_at token and SHALL return a 409 Conflict when a stale update is detected.
4. WHEN reordering positioned items, THE DAL SHALL update affected rows atomically to avoid duplicate or gapped positions.

**Skills exercised:** Transactions, isolation levels, optimistic concurrency, row locking, atomic reordering.

## Phase 3: Authentication and Authorization

### Requirement 3.1: Registration and Password Security

**User Story:** As a new user, I want to create an account with email and password, so that I can access the application securely.

#### Acceptance Criteria

1. WHEN a user submits a valid email and password, THE Auth_Service SHALL create a user record with a securely hashed password (e.g., PBKDF2/bcrypt/Argon2) and a salt.
2. IF the email is already registered, THEN THE Auth_Service SHALL return a 409 Conflict with a clear error.
3. IF the password does not meet policy (minimum 8 characters), THEN THE API SHALL reject the request with a validation error.
4. THE Auth_Service SHALL never store or log plaintext passwords.

**Skills exercised:** Password hashing, input validation, secure account creation.

### Requirement 3.2: JWT Issuance and Refresh Token Rotation

**User Story:** As a registered user, I want to sign in and maintain a session, so that I stay authenticated without re-entering credentials frequently.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THE Auth_Service SHALL issue a short-lived signed JWT access token and a longer-lived Refresh_Token.
2. THE JWT SHALL include claims for user id, email, and roles/memberships needed for authorization.
3. WHEN a client presents a valid Refresh_Token, THE Auth_Service SHALL issue a new access token and a new Refresh_Token, and SHALL invalidate the previous Refresh_Token (rotation).
4. WHEN a Refresh_Token is reused after rotation, THE Auth_Service SHALL treat it as compromised and revoke the token family.
5. WHEN a user signs out, THE Auth_Service SHALL revoke the active Refresh_Token(s) for that session.
6. IF credentials are invalid, THEN THE Auth_Service SHALL return a 401 without revealing which field was wrong.

**Skills exercised:** JWT, refresh-token rotation and reuse detection, session/token lifecycle, claims.

### Requirement 3.3: Google OAuth Sign-In

**User Story:** As a user, I want to sign in with Google, so that I can authenticate without a separate password.

#### Acceptance Criteria

1. WHEN a user initiates Google sign-in, THE Auth_Service SHALL complete the OpenID Connect authorization-code flow and validate the returned ID token.
2. WHEN a Google identity has no existing account, THE Auth_Service SHALL provision a user and profile record from the verified claims.
3. WHEN authentication succeeds, THE Auth_Service SHALL issue the same JWT + Refresh_Token pair as password sign-in.
4. IF the OAuth flow fails or the token is invalid, THEN THE API SHALL return an authentication error without creating an account.

**Skills exercised:** OAuth 2.0 / OpenID Connect, external identity provisioning, token validation.

### Requirement 3.4: Authorization Policies and Resource-Based Access

**User Story:** As a workspace admin, I want access enforced by role and by resource ownership, so that users can only act within their permissions. (This replaces the Supabase RLS model with application-enforced authorization.)

#### Acceptance Criteria

1. THE API SHALL protect all endpoints except authentication routes using JWT bearer authentication.
2. THE API SHALL define Auth_Policies for workspace roles (Admin, Member, Viewer) and enforce them on relevant endpoints.
3. THE API SHALL implement Resource_Handlers that verify the authenticated user has the required role for the specific workspace/board/task instance being accessed, not merely a global role.
4. WHILE a user holds the Viewer role, THE API SHALL reject create/update/delete operations on that workspace's resources with 403.
5. WHILE a user holds the Member role, THE API SHALL allow board and task operations but reject workspace-settings and membership changes.
6. WHERE a board is private, THE API SHALL restrict access to explicitly assigned board members regardless of workspace role.
7. WHEN an authorization check fails, THE API SHALL return 403 (authenticated but not permitted) or 404 (to avoid leaking existence of private resources) as appropriate.

**Skills exercised:** Role-based, policy-based, and resource-based authorization; authorization handlers; secure-by-default endpoint protection.

## Phase 4: Core Domain Features

### Requirement 4.1: Workspace Management

**User Story:** As a user, I want to create and manage workspaces, so that I can organize my team's work into separate environments.

#### Acceptance Criteria

1. WHEN a user creates a workspace with a valid name, THE API SHALL insert a workspace and assign the creator as Admin within a single transaction.
2. WHEN an Admin updates workspace settings, THE API SHALL persist the changes.
3. WHEN an Admin deletes a workspace, THE API SHALL remove the workspace and all associated boards, columns, tasks, and memberships transactionally.
4. WHEN a user requests their workspaces, THE API SHALL return only workspaces where the user is a member.

**Skills exercised:** Transactional writes, resource-based authorization, REST resource modeling.

### Requirement 4.2: Membership, Invitations, and Roles

**User Story:** As a workspace admin, I want to invite members and manage roles, so that I can control access.

#### Acceptance Criteria

1. WHEN an Admin invites a user by email, THE API SHALL create a pending invitation and enqueue an email notification via a background job.
2. WHEN an invited user accepts, THE API SHALL create a workspace_member record with the assigned role.
3. WHEN an Admin changes a member's role, THE API SHALL update it and the change SHALL take effect on subsequent authorization checks.
4. WHEN an Admin removes a member, THE API SHALL delete the membership and revoke that user's access.

**Skills exercised:** Invitation workflow, role management, background job enqueue, authorization.

### Requirement 4.3: Board and Column Management

**User Story:** As a workspace member, I want to manage boards and their columns, so that I can structure workflows.

#### Acceptance Criteria

1. WHEN a member creates a board with a valid name, THE API SHALL insert a board associated with the workspace.
2. WHEN a member edits, archives, or deletes a board, THE API SHALL persist the change, with delete removing all child columns and tasks transactionally.
3. WHEN a member adds, renames, reorders, or deletes a column, THE API SHALL persist the change and maintain correct position values across affected columns.
4. WHILE a user holds the Viewer role, THE API SHALL reject board and column mutations with 403.
5. THE App SHALL use Angular CDK DragDrop for column reordering and SHALL persist the new order to the API.

**Skills exercised:** CRUD over ADO.NET, atomic reordering, authorization, CDK DragDrop integration.

### Requirement 4.4: Task Cards and Drag-and-Drop

**User Story:** As a board member, I want to create and move task cards, so that I can track work visually.

#### Acceptance Criteria

1. WHEN a member adds a card with a title to a column, THE API SHALL create a task with the next sequential position.
2. WHEN a member moves a card within or across columns, THE API SHALL update the column reference and position values of affected tasks within a single transaction.
3. THE App SHALL optimistically update the UI on drag and SHALL revert if the API request fails.
4. THE App SHALL use CDK DragDrop with placeholder animation during drag operations.

**Skills exercised:** Transactional reordering across lists, optimistic UI with rollback, REST semantics.

### Requirement 4.5: Task Detail Fields, Labels, and Subtasks

**User Story:** As a board member, I want rich task details, so that I can organize and track work effectively.

#### Acceptance Criteria

1. THE App SHALL open a slide-over panel showing title, description, priority, labels, assignees, due date, subtasks, comments, and activity when a card is clicked.
2. WHEN a field is edited in the panel, THE API SHALL persist the change immediately (auto-save) using optimistic concurrency per Requirement 2.3.
3. WHEN a member sets priority (Critical, High, Medium, Low), THE API SHALL persist it and THE App SHALL show the color-coded badge.
4. WHEN a member manages labels, THE API SHALL maintain task_labels associations; WHEN a label is edited or deleted, changes SHALL reflect on all associated tasks.
5. WHEN a member manages assignees, THE API SHALL maintain task_assignees records.
6. WHEN a member adds, toggles, reorders, or deletes subtasks, THE API SHALL persist changes and THE App SHALL show a completion progress bar.

**Skills exercised:** Many-to-many modeling in raw SQL, optimistic concurrency, CDK Overlay/portal for slide-over, computed signals.

### Requirement 4.6: Comments and Activity Log

**User Story:** As a board member, I want comments and a change history on tasks, so that I can collaborate and audit changes.

#### Acceptance Criteria

1. WHEN a member posts a comment, THE API SHALL store it with author and timestamp; edits SHALL set an "edited" indicator and deletes SHALL remove only the author's own comments.
2. WHEN a task field changes, THE API SHALL write an Activity entry (actor, field, old value, new value, timestamp) as part of the same operation via an application-layer activity service (not database triggers).
3. THE App SHALL display comments chronologically and the activity log in reverse chronological order, visually distinguished.

**Skills exercised:** Audit logging in the service layer, ownership authorization, consistent write composition.

## Phase 5: Advanced Query Features (Raw SQL Focus)

### Requirement 5.1: Pagination, Filtering, and Sorting

**User Story:** As a developer, I want a reusable pagination/filter/sort pattern, so that list endpoints are efficient and consistent.

#### Acceptance Criteria

1. THE API SHALL provide paginated responses (page, pageSize, totalCount, items) for list endpoints such as activity feeds and notifications.
2. THE API SHALL implement filtering and sorting in SQL (not in memory) using safe, parameterized dynamic query construction with a whitelist of sortable/filterable fields.
3. THE App SHALL apply board-level card filters (assignee, label, priority, due date) and search client-side using computed signals for instant feedback, while server endpoints remain available for large datasets.

**Skills exercised:** SQL pagination, safe dynamic SQL, whitelisting, keyset/offset paging tradeoffs.

### Requirement 5.2: Full-Text Search

**User Story:** As a board member, I want to search tasks by text, so that I can find work quickly.

#### Acceptance Criteria

1. THE API SHALL support searching tasks by title and description using PostgreSQL full-text search backed by a GIN index.
2. WHEN a search term is provided, THE API SHALL rank and return matching tasks scoped to boards the user may access.

**Skills exercised:** PostgreSQL full-text search, tsvector/tsquery, GIN indexing, ranking.

### Requirement 5.3: Dashboard Aggregations

**User Story:** As a user, I want a personal dashboard of my tasks across boards, so that I can manage my workload in one place.

#### Acceptance Criteria

1. WHEN a user opens the dashboard, THE API SHALL aggregate tasks assigned to the user across all workspaces using SQL, grouped into overdue, due today, due this week, and upcoming.
2. THE API SHALL return counts of assigned tasks grouped by priority computed in SQL.
3. THE aggregation queries SHALL use joins, CTEs, and window functions where they express the result more clearly or efficiently than application-side computation.

**Skills exercised:** Complex SQL (joins, CTEs, window functions), aggregation, date bucketing, query optimization mindset.

## Phase 6: Real-Time Collaboration

### Requirement 6.1: SignalR Board Updates

**User Story:** As a board member, I want to see others' changes in real time, so that I stay in sync with my team.

#### Acceptance Criteria

1. THE API SHALL expose a SignalR Hub that authenticates connections using the JWT.
2. WHILE a user views a board, THE App SHALL join a Hub group scoped to that board id.
3. WHEN a task or column is created, updated, moved, or deleted, THE API SHALL broadcast the change to the board's group and connected clients SHALL reflect it within 2 seconds.
4. WHEN the connection is lost, THE App SHALL show a connection-status indicator and attempt to reconnect with backoff.
5. WHEN the connection is re-established, THE App SHALL fetch the latest board state to reconcile any missed updates.
6. WHERE the deployment runs multiple API instances, THE Hub SHALL be configured with a scale-out backplane.

**Skills exercised:** SignalR hubs and groups, hub authentication, reconnection handling, state reconciliation, scale-out backplane.

## Phase 7: AI Integration (Server-Side Proxy)

### Requirement 7.1: AI Proxy Endpoint

**User Story:** As a developer, I want AI calls routed through my Web API, so that the OpenAI key stays secret and requests are validated and rate-limited.

#### Acceptance Criteria

1. THE AI_Proxy SHALL require a valid JWT and SHALL forward only the necessary text payload to OpenAI, never client credentials.
2. THE AI_Proxy SHALL enforce a rate limit of 20 AI requests per user per hour and return 429 when exceeded.
3. IF the OpenAI call fails or times out, THEN THE AI_Proxy SHALL return a standardized error and THE App SHALL allow retry or manual entry.
4. THE AI_Proxy SHALL apply a request timeout and a bounded retry policy, and SHALL NOT persist user text beyond the request lifecycle.
5. THE AI_Proxy SHALL parse OpenAI responses into typed structured output before returning them to the client.

**Skills exercised:** Server-side third-party integration, secret protection, rate limiting, timeout/retry (resilience), structured output parsing.

### Requirement 7.2: Smart Task Creation and Subtask Generation

**User Story:** As a board member, I want AI to extract tasks from notes and suggest subtasks, so that I can capture and break down work quickly.

#### Acceptance Criteria

1. WHEN a user submits unstructured text, THE AI_Proxy SHALL return structured task suggestions (title, suggested priority, suggested assignee) for review.
2. WHEN a user confirms suggestions, THE API SHALL create the corresponding task records.
3. WHEN a user requests subtask generation for a task, THE AI_Proxy SHALL return suggested subtasks for selection, and confirmed items SHALL be persisted as subtasks.
4. WHEN a user requests a board summary, THE AI_Proxy SHALL return a natural-language summary of progress, blockers, and highlights; IF the board has no tasks, THE App SHALL indicate there is nothing to summarize.

**Skills exercised:** Prompt design, structured extraction, review-before-commit UX, transactional persistence of AI output.

## Phase 8: Notifications and Background Processing

### Requirement 8.1: Notification Center

**User Story:** As a user, I want in-app notifications, so that I stay informed about assignments, comments, and invitations.

#### Acceptance Criteria

1. WHEN a user is assigned a task, a comment is posted on their task, or they are invited to a workspace, THE API SHALL create a notification record.
2. THE App SHALL display an unread count badge and list notifications in reverse chronological order with read/unread status.
3. WHEN a user opens or clicks a notification, THE API SHALL mark it read and THE App SHALL navigate to the related resource.
4. THE API SHALL push new notifications to the user in real time via SignalR.

**Skills exercised:** Event-driven writes, real-time push, read-state management.

### Requirement 8.2: Background Jobs

**User Story:** As a developer, I want deferred work handled by background services, so that request latency stays low and transient failures are retried.

#### Acceptance Criteria

1. THE API SHALL process email sending (invitations, password reset) via a hosted BackgroundService rather than inline in the request path.
2. THE background processor SHALL retry transient failures with backoff and SHALL log terminal failures.
3. WHERE work is queued, THE API SHALL enqueue durably enough to survive normal operation and SHALL not lose accepted work on graceful shutdown.

**Skills exercised:** Hosted services / BackgroundService, queueing, retry with backoff, graceful shutdown.

### Requirement 8.3: Password Reset and Account Settings

**User Story:** As a user, I want to reset my password and manage my account, so that I can control access.

#### Acceptance Criteria

1. WHEN a user requests a password reset for a registered email, THE API SHALL generate a secure, expiring reset token and enqueue a reset email; for unregistered emails it SHALL return a generic success to prevent enumeration.
2. WHEN a user submits a valid reset token and new password, THE API SHALL update the hashed password and invalidate the token.
3. WHEN a user requests account deletion and confirms, THE API SHALL delete the profile, remove memberships, and delete the account transactionally.
4. WHEN a user signs out, THE API SHALL revoke refresh tokens and THE App SHALL clear local state and redirect to sign-in.

**Skills exercised:** Secure token flows, enumeration prevention, transactional account lifecycle.

## Phase 9: Cross-Cutting Hardening

### Requirement 9.1: Validation

**User Story:** As a developer, I want consistent request validation, so that invalid input is rejected uniformly.

#### Acceptance Criteria

1. THE API SHALL validate all incoming DTOs using FluentValidation and return structured 400 responses listing field errors.
2. THE API SHALL apply validation via a filter or pipeline step so controllers remain thin.

**Skills exercised:** FluentValidation, validation pipeline, thin controllers.

### Requirement 9.2: Caching and Response Efficiency

**User Story:** As a developer, I want caching where appropriate, so that repeat reads are fast and cheap.

#### Acceptance Criteria

1. THE API SHALL cache suitable read-heavy, slow-changing data (e.g., workspace membership lookups used in authorization) using in-memory caching, with a path to distributed caching (Redis) for multi-instance deployments.
2. WHERE responses are cacheable, THE API SHALL support ETag/conditional requests or response caching and SHALL invalidate on writes.

**Skills exercised:** In-memory and distributed caching, cache invalidation, ETags/conditional requests.

### Requirement 9.3: Rate Limiting and Idempotency

**User Story:** As a developer, I want abuse protection and safe retries, so that the API is resilient.

#### Acceptance Criteria

1. THE API SHALL apply global and per-user rate limiting using ASP.NET Core rate limiting middleware and return 429 with retry information when limits are exceeded.
2. WHERE a create operation may be retried by clients, THE API SHALL support an idempotency key so duplicate submissions do not create duplicate records.

**Skills exercised:** Rate limiting middleware, idempotency keys, resilience.

### Requirement 9.4: Security Baseline

**User Story:** As a developer, I want a security baseline, so that the API follows accepted practices.

#### Acceptance Criteria

1. THE API SHALL enforce HTTPS and configure a restrictive CORS policy allowing only the known frontend origin(s).
2. THE API SHALL rely exclusively on parameterized SQL (per Requirement 2.2) to prevent injection.
3. THE API SHALL set appropriate security headers and SHALL avoid returning sensitive data or stack traces in error responses.

**Skills exercised:** HTTPS, CORS, OWASP fundamentals, secure error handling.

## Phase 10: Testing and Delivery

### Requirement 10.1: Unit Testing

**User Story:** As a developer, I want unit tests for business logic, so that behavior is verified in isolation.

#### Acceptance Criteria

1. THE application-layer services SHALL have unit tests using xUnit with mocked repository interfaces (Moq/NSubstitute).
2. THE authorization handlers and token/refresh logic SHALL be covered by unit tests including failure and edge cases.

**Skills exercised:** xUnit, mocking, testable design, isolating I/O behind interfaces.

### Requirement 10.2: Integration Testing

**User Story:** As a developer, I want integration tests against a real database, so that raw SQL and wiring are verified end to end.

#### Acceptance Criteria

1. THE API SHALL have integration tests using WebApplicationFactory and a real PostgreSQL instance provisioned via Testcontainers.
2. THE integration tests SHALL cover representative flows: auth (sign-in + refresh rotation), a transactional multi-statement operation (e.g., board delete or reorder), and an authorization-denied case.
3. THE integration tests SHALL apply the versioned migration scripts to the test database before running.

**Skills exercised:** Integration testing, WebApplicationFactory, Testcontainers, verifying raw SQL and transactions.

### Requirement 10.3: Delivery and Observability

**User Story:** As a developer, I want repeatable delivery and basic observability, so that the app can be built, run, and monitored consistently.

#### Acceptance Criteria

1. THE project SHALL run end to end via docker-compose (API + PostgreSQL) with migrations applied on startup.
2. THE project SHALL provide a CI workflow that builds the solution, runs unit and integration tests, and fails on errors.
3. THE API SHALL emit structured logs and expose health endpoints suitable for monitoring.

**Skills exercised:** Docker Compose, CI/CD basics, observability, migration-on-deploy.

## Non-Functional Requirements

### Requirement NFR.1: State Management and Serialization (Frontend)

#### Acceptance Criteria

1. THE App SHALL use Angular signals for service-level state without external state libraries and computed signals for derived state (filtered tasks, sorted lists, aggregated counts).
2. THE App SHALL parse API JSON responses into typed TypeScript interfaces, and for those interfaces, serializing to JSON then parsing back SHALL produce an equivalent object (round-trip property).
3. THE App SHALL use `effect()` for side effects triggered by signal changes (persisting preferences, subscribing to SignalR channels).

### Requirement NFR.2: Responsive Layout and Navigation

#### Acceptance Criteria

1. THE App SHALL provide sidebar navigation with a workspace switcher, board links, and a user menu, collapsing to a hamburger menu below 768px.
2. THE App SHALL maintain a minimum usable board width of 320px per visible column with horizontal scrolling for additional columns.

### Requirement NFR.3: Keyboard Shortcuts and Accessibility

#### Acceptance Criteria

1. THE App SHALL support shortcuts for new task (N), search (Ctrl/Cmd+K), close panel (Escape), navigate boards (B), and a help overlay (?), suppressing single-key shortcuts while inputs are focused.
2. THE custom directives and components SHALL support keyboard navigation and screen-reader attributes, targeting WCAG 2.1 AA (full conformance to be confirmed via manual assistive-technology testing and expert review).

### Requirement NFR.4: Performance

#### Acceptance Criteria

1. THE API SHALL back all frequent query paths with appropriate indexes and SHALL avoid N+1 query patterns by composing set-based SQL.
2. THE App SHALL reflect real-time board changes within 2 seconds under normal conditions.

## Skills Coverage Matrix

| Senior-level topic | Covered by |
| --- | --- |
| Layered/Clean architecture, DI, lifetimes | 1.1 |
| Configuration, Options, secrets | 1.2 |
| OpenAPI/Swagger, API versioning | 1.3 |
| Custom middleware, ProblemDetails, Serilog, correlation IDs | 1.4 |
| Health checks, Docker/compose | 1.5, 10.3 |
| Schema design, constraints, indexing (B-tree/GIN/partial), migrations | 2.1 |
| ADO.NET/Npgsql, parameterized SQL, repository + UoW, pooling, async/cancellation | 2.2 |
| Transactions, isolation levels, optimistic concurrency, atomic reordering | 2.3, 4.3, 4.4 |
| Password hashing, secure registration | 3.1 |
| JWT, refresh rotation + reuse detection, claims | 3.2 |
| OAuth 2.0 / OpenID Connect | 3.3 |
| Role/policy/resource-based authorization | 3.4 |
| Many-to-many modeling, service-layer audit logging | 4.5, 4.6 |
| Pagination, safe dynamic SQL, whitelisting | 5.1 |
| PostgreSQL full-text search, GIN, ranking | 5.2 |
| Complex SQL: joins, CTEs, window functions | 5.3 |
| SignalR hubs/groups/auth/reconnect/backplane | 6.1, 8.1 |
| Third-party integration, resilience (timeout/retry), structured parsing | 7.1, 7.2 |
| Background services, queueing, retry/backoff | 8.2, 8.3 |
| FluentValidation pipeline | 9.1 |
| Caching (in-memory/distributed), ETags | 9.2 |
| Rate limiting, idempotency | 9.3, 7.1 |
| HTTPS, CORS, OWASP, secure errors | 9.4 |
| Unit testing (xUnit, mocking) | 10.1 |
| Integration testing (WebApplicationFactory, Testcontainers) | 10.2 |
| CI/CD, observability | 10.3 |
| Angular signals, computed, effects, typed serialization | NFR.1 |
| Responsive UI, accessibility, keyboard shortcuts | NFR.2, NFR.3 |
