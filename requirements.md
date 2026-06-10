# Requirements Document

## Introduction

Smart Task Manager is a Kanban/Trello-like task management application built with Angular 20+ and Supabase. It provides team collaboration through workspaces and boards, AI-powered task creation, real-time updates, and a fully custom UI. The application supports authentication via email and Google OAuth, drag-and-drop Kanban boards, task detail slide-over panels, and intelligent features powered by OpenAI (GPT-4o-mini) through Supabase Edge Functions.

## Glossary

- **App**: The Smart Task Manager Angular application
- **Auth_Service**: The authentication service managing sign-up, sign-in, session, and token refresh via Supabase Auth
- **Workspace_Service**: The service managing workspace CRUD operations, membership, and roles
- **Board_Service**: The service managing board CRUD, column operations, and board-level permissions
- **Task_Service**: The service managing task card CRUD, assignments, labels, subtasks, and comments
- **AI_Service**: The service calling Supabase Edge Functions to invoke OpenAI for smart task features
- **Notification_Service**: The service managing real-time notifications and the notification center
- **Dashboard_Service**: The service aggregating personal task data across boards
- **Theme_Service**: The service managing dark/light theme preferences
- **Profile_Service**: The service managing user profile data and avatar uploads
- **Slide_Over_Panel**: A custom overlay panel that slides in from the right side to display task details
- **RLS**: Row Level Security policies enforced at the Supabase PostgreSQL level
- **Workspace**: A top-level organizational unit containing boards and members
- **Board**: A Kanban board containing columns and task cards within a workspace
- **Column**: A vertical list within a board representing a workflow stage
- **Task_Card**: An individual work item within a column
- **Subtask**: A checklist item belonging to a Task_Card
- **Label**: A color-coded tag that can be applied to Task_Cards
- **Edge_Function**: A Supabase serverless function that proxies requests to OpenAI

## Requirements

### Requirement 1: User Registration

**User Story:** As a new user, I want to create an account using email or Google OAuth, so that I can access the application.

#### Acceptance Criteria

1. WHEN a user submits a valid email and password, THE Auth_Service SHALL create a new account and send a confirmation email
2. WHEN a user selects Google OAuth sign-up, THE Auth_Service SHALL redirect to Google, authenticate, and create a profile record upon successful return
3. IF a user submits an email that already exists, THEN THE Auth_Service SHALL display an error message indicating the email is already registered
4. IF a user submits a password shorter than 8 characters, THEN THE Auth_Service SHALL display a validation error before submission
5. WHEN account creation succeeds, THE App SHALL navigate the user to the dashboard route

### Requirement 2: User Sign-In and Session Management

**User Story:** As a registered user, I want to sign in and maintain my session, so that I can access my workspaces without repeated authentication.

#### Acceptance Criteria

1. WHEN a user submits valid email and password credentials, THE Auth_Service SHALL authenticate the user and store the session token
2. WHEN a user selects Google OAuth sign-in, THE Auth_Service SHALL authenticate via Google and establish a session
3. IF a user submits invalid credentials, THEN THE Auth_Service SHALL display an error message indicating authentication failure
4. WHILE a user session is active, THE Auth_Service SHALL refresh the token before expiration using the Supabase refresh token mechanism
5. WHEN a session token expires and cannot be refreshed, THE App SHALL redirect the user to the sign-in page
6. THE App SHALL use a functional auth guard to protect all routes except /auth/* paths
7. THE App SHALL use a functional HTTP interceptor to attach the Bearer token to all Supabase API requests

### Requirement 3: Password Reset

**User Story:** As a user who forgot their password, I want to reset it via email, so that I can regain access to my account.

#### Acceptance Criteria

1. WHEN a user submits a valid registered email on the password reset form, THE Auth_Service SHALL send a password reset email with a secure link
2. WHEN a user clicks a valid reset link and submits a new password, THE Auth_Service SHALL update the password and redirect to sign-in
3. IF a user submits an email that is not registered, THEN THE Auth_Service SHALL display a generic success message to prevent email enumeration
4. IF a reset link has expired, THEN THE App SHALL display a message indicating the link is no longer valid and offer to resend

### Requirement 4: User Profile Management

**User Story:** As a user, I want to manage my profile including avatar upload, so that team members can identify me.

#### Acceptance Criteria

1. THE Profile_Service SHALL display the current user's name, email, and avatar on the profile page
2. WHEN a user uploads a new avatar image, THE Profile_Service SHALL upload the file to Supabase Storage and update the profile record with the new URL
3. IF a user uploads a file exceeding 2MB or not an image type, THEN THE Profile_Service SHALL display a validation error
4. WHEN a user updates their display name, THE Profile_Service SHALL persist the change to the profiles table

### Requirement 5: Workspace Creation and Management

**User Story:** As a user, I want to create and manage workspaces, so that I can organize my team's work into separate environments.

#### Acceptance Criteria

1. WHEN a user creates a workspace with a valid name, THE Workspace_Service SHALL insert a workspace record and assign the creator as Admin
2. WHEN a user updates workspace settings (name, description), THE Workspace_Service SHALL persist the changes
3. WHEN a user deletes a workspace, THE Workspace_Service SHALL remove the workspace and all associated boards, columns, tasks, and memberships
4. THE Workspace_Service SHALL enforce RLS so that only workspace members can view workspace data
5. WHEN a user navigates to /w/:workspaceId/boards, THE App SHALL display all boards belonging to that workspace

### Requirement 6: Team Member Invitation and Role Management

**User Story:** As a workspace admin, I want to invite members via email and assign roles, so that I can control access to the workspace.

#### Acceptance Criteria

1. WHEN an Admin invites a user by email, THE Workspace_Service SHALL create a pending invitation and send an email notification
2. WHEN an invited user accepts the invitation, THE Workspace_Service SHALL add them as a workspace member with the assigned role (Admin, Member, or Viewer)
3. WHILE a user has the Viewer role, THE Workspace_Service SHALL restrict the user to read-only access on all workspace resources
4. WHILE a user has the Member role, THE Workspace_Service SHALL allow creating and editing boards and tasks but restrict workspace settings
5. WHEN an Admin changes a member's role, THE Workspace_Service SHALL update the role immediately and adjust permissions
6. WHEN an Admin removes a member, THE Workspace_Service SHALL delete the membership record and revoke access

### Requirement 7: Activity Feed

**User Story:** As a workspace member, I want to see an activity feed, so that I can track what's happening across the workspace.

#### Acceptance Criteria

1. WHEN a task is created, moved, assigned, or completed within a workspace, THE Workspace_Service SHALL log an activity entry with actor, action, target, and timestamp
2. THE App SHALL display the activity feed on the workspace page in reverse chronological order
3. THE App SHALL paginate the activity feed showing 20 entries per page


### Requirement 8: Board CRUD Operations

**User Story:** As a workspace member, I want to create, edit, archive, and delete boards, so that I can organize work into logical groupings.

#### Acceptance Criteria

1. WHEN a user creates a board with a valid name, THE Board_Service SHALL insert a board record associated with the current workspace
2. WHEN a user edits a board's name or description, THE Board_Service SHALL persist the update
3. WHEN a user archives a board, THE Board_Service SHALL mark the board as archived and hide it from the default board listing
4. WHEN a user deletes a board, THE Board_Service SHALL remove the board and all associated columns and tasks
5. THE Board_Service SHALL enforce RLS so that only workspace members with appropriate roles can modify boards
6. WHILE a user has the Viewer role, THE Board_Service SHALL prevent board creation, editing, archiving, and deletion

### Requirement 9: Board Listing and Favorites

**User Story:** As a workspace member, I want to view boards in grid or list format and mark favorites, so that I can quickly access the boards I use most.

#### Acceptance Criteria

1. WHEN a user navigates to the boards page, THE App SHALL display all non-archived boards for the current workspace
2. THE App SHALL support toggling between grid view and list view for the board listing
3. WHEN a user stars a board, THE Board_Service SHALL persist the favorite status for that user
4. THE App SHALL display starred boards at the top of the board listing
5. THE App SHALL persist the user's preferred view mode (grid/list) across sessions

### Requirement 10: Board-Level Permissions

**User Story:** As a workspace admin, I want to set board-level permissions, so that I can restrict access to sensitive boards.

#### Acceptance Criteria

1. WHEN an Admin sets a board to private, THE Board_Service SHALL restrict visibility to explicitly assigned board members only
2. WHEN an Admin sets a board to workspace-visible, THE Board_Service SHALL allow all workspace members to view the board
3. THE Board_Service SHALL enforce board-level permissions via RLS policies in addition to workspace-level policies

### Requirement 11: Kanban Column Management

**User Story:** As a board member, I want to add, rename, reorder, and delete columns, so that I can customize the workflow stages.

#### Acceptance Criteria

1. WHEN a user adds a column with a valid name, THE Board_Service SHALL insert a column record with the next sequential position value
2. WHEN a user renames a column, THE Board_Service SHALL update the column name
3. WHEN a user drags a column to a new position, THE Board_Service SHALL update the position values of all affected columns to reflect the new order
4. WHEN a user deletes a column, THE Board_Service SHALL remove the column and offer to move or delete contained tasks
5. THE App SHALL use Angular CDK DragDrop for column reordering with smooth visual feedback

### Requirement 12: Task Card Quick-Add

**User Story:** As a board member, I want to quickly add task cards to a column, so that I can capture work items without leaving the board view.

#### Acceptance Criteria

1. WHEN a user clicks the add card button on a column and submits a title, THE Task_Service SHALL create a task record in that column with the next sequential position
2. THE App SHALL focus the title input immediately upon clicking add card
3. WHEN a user presses Enter after typing a title, THE Task_Service SHALL create the card and keep the input open for rapid entry
4. WHEN a user presses Escape or clicks outside, THE App SHALL cancel the quick-add operation

### Requirement 13: Task Card Drag-and-Drop

**User Story:** As a board member, I want to drag and drop cards between columns and within a column, so that I can update task status visually.

#### Acceptance Criteria

1. WHEN a user drags a card within the same column, THE Task_Service SHALL update position values to reflect the new order
2. WHEN a user drags a card to a different column, THE Task_Service SHALL update the card's column reference and position value
3. THE App SHALL use Angular CDK DragDrop with placeholder animation during drag operations
4. THE App SHALL optimistically update the UI and revert if the server request fails

### Requirement 14: Task Card Detail Slide-Over Panel

**User Story:** As a board member, I want to view and edit full task details in a slide-over panel, so that I can manage task information without leaving the board.

#### Acceptance Criteria

1. WHEN a user clicks a task card on the board, THE App SHALL open a slide-over panel from the right displaying full task details
2. THE Slide_Over_Panel SHALL display: title, description, priority, labels, assignees, due date, subtasks, comments, and activity log
3. WHEN a user clicks outside the panel or presses Escape, THE App SHALL close the slide-over panel
4. THE App SHALL implement the slide-over panel using CDK Overlay or a custom portal directive
5. WHEN any field is edited in the panel, THE Task_Service SHALL persist the change immediately (auto-save)

### Requirement 15: Task Filtering and Search

**User Story:** As a board member, I want to filter and search cards on the board, so that I can focus on relevant tasks.

#### Acceptance Criteria

1. WHEN a user selects filter criteria (assignee, label, priority, or due date), THE App SHALL show only cards matching all selected criteria
2. WHEN a user types in the board search input, THE App SHALL filter cards whose title or description contains the search text
3. WHEN a user clears all filters, THE App SHALL display all cards in their original positions
4. THE App SHALL display a visual indicator showing the number of active filters
5. THE App SHALL apply filters client-side using computed signals for instant feedback

### Requirement 16: Task Card Detail Fields

**User Story:** As a board member, I want to set priority, labels, assignees, and due dates on tasks, so that I can organize and track work effectively.

#### Acceptance Criteria

1. WHEN a user sets a priority level (Critical, High, Medium, Low), THE Task_Service SHALL persist the priority and display the corresponding color-coded badge
2. WHEN a user adds a label to a task, THE Task_Service SHALL create a task_labels association record
3. WHEN a user assigns members to a task, THE Task_Service SHALL create task_assignees records for each selected member
4. WHEN a user sets a due date using the calendar picker, THE Task_Service SHALL persist the due date
5. THE App SHALL display overdue tasks with a visual warning indicator when the due date has passed

### Requirement 17: Custom Labels Management

**User Story:** As a board member, I want to create and manage custom color-coded labels, so that I can categorize tasks visually.

#### Acceptance Criteria

1. WHEN a user creates a label with a name and color, THE Task_Service SHALL insert a label record scoped to the current board
2. WHEN a user edits a label's name or color, THE Task_Service SHALL update the label and reflect changes on all associated tasks
3. WHEN a user deletes a label, THE Task_Service SHALL remove the label and all task_labels associations

### Requirement 18: Subtasks and Checklist

**User Story:** As a board member, I want to add subtasks with a progress bar, so that I can break down work and track completion.

#### Acceptance Criteria

1. WHEN a user adds a subtask with a title, THE Task_Service SHALL insert a subtask record linked to the parent task
2. WHEN a user toggles a subtask as complete or incomplete, THE Task_Service SHALL update the subtask status
3. THE App SHALL display a progress bar showing the ratio of completed subtasks to total subtasks
4. WHEN a user reorders subtasks via drag-and-drop, THE Task_Service SHALL update position values accordingly
5. WHEN a user deletes a subtask, THE Task_Service SHALL remove the subtask record

### Requirement 19: Comments Thread

**User Story:** As a board member, I want to post comments on tasks, so that I can discuss work with teammates.

#### Acceptance Criteria

1. WHEN a user submits a comment with text content, THE Task_Service SHALL insert a comment record with author and timestamp
2. THE App SHALL display comments in chronological order within the task detail panel
3. WHEN a user edits their own comment, THE Task_Service SHALL update the comment text and display an "edited" indicator
4. WHEN a user deletes their own comment, THE Task_Service SHALL remove the comment record

### Requirement 20: Task Activity Log

**User Story:** As a board member, I want to see a history of changes on a task, so that I can understand what happened and when.

#### Acceptance Criteria

1. WHEN a task field is changed (title, description, priority, status, assignees, labels, due date), THE Task_Service SHALL log an activity entry with actor, field changed, old value, new value, and timestamp
2. THE App SHALL display the activity log in reverse chronological order within the task detail panel
3. THE App SHALL distinguish between comments and activity entries visually in the task detail panel

### Requirement 21: Move and Copy Card

**User Story:** As a board member, I want to move or copy a card to another column or board, so that I can reorganize work flexibly.

#### Acceptance Criteria

1. WHEN a user moves a card to another column within the same board, THE Task_Service SHALL update the column reference and position
2. WHEN a user moves a card to a different board, THE Task_Service SHALL update the board and column references
3. WHEN a user copies a card, THE Task_Service SHALL create a duplicate task record with all fields except comments and activity log


### Requirement 22: AI Smart Task Creation

**User Story:** As a board member, I want to paste meeting notes or unstructured text and have AI extract tasks, so that I can quickly capture action items.

#### Acceptance Criteria

1. WHEN a user submits unstructured text (meeting notes, email content) to the smart task creator, THE AI_Service SHALL call the Supabase Edge Function which invokes GPT-4o-mini to extract structured tasks
2. WHEN the Edge Function returns extracted tasks, THE App SHALL display them as a preview list with title, suggested priority, and suggested assignee for user review
3. WHEN a user confirms the extracted tasks, THE Task_Service SHALL create task records in the specified column
4. WHEN a user edits an extracted task before confirmation, THE App SHALL allow inline editing of title, priority, and assignee
5. IF the AI_Service call fails or times out, THEN THE App SHALL display an error message and allow the user to retry or manually create tasks
6. THE AI_Service SHALL send only the text content to the Edge Function without any user credentials or sensitive metadata

### Requirement 23: AI Subtask Generation

**User Story:** As a board member, I want AI to suggest subtasks for a task, so that I can break down complex work efficiently.

#### Acceptance Criteria

1. WHEN a user requests subtask generation for a task, THE AI_Service SHALL send the task title and description to the Edge Function to generate suggested subtasks
2. WHEN the Edge Function returns suggested subtasks, THE App SHALL display them as a selectable list for user review
3. WHEN a user confirms selected subtasks, THE Task_Service SHALL create subtask records linked to the parent task
4. IF the AI_Service call fails, THEN THE App SHALL display an error message and allow manual subtask creation

### Requirement 24: AI Board Summary and Status Report

**User Story:** As a workspace member, I want AI to generate a summary of board activity, so that I can quickly understand project status.

#### Acceptance Criteria

1. WHEN a user requests a board summary, THE AI_Service SHALL send board data (column names, task counts, recent activity) to the Edge Function to generate a natural language summary
2. THE App SHALL display the generated summary in a readable format including: overall progress, blockers, and recent highlights
3. IF the board has no tasks, THEN THE App SHALL display a message indicating there is no data to summarize

### Requirement 25: Real-Time Board Updates

**User Story:** As a board member, I want to see changes made by other users in real time, so that I stay in sync with my team.

#### Acceptance Criteria

1. WHILE a user is viewing a board, THE App SHALL subscribe to Supabase Realtime channels for the tasks, columns, and task_assignees tables filtered by board ID
2. WHEN another user creates, updates, or deletes a task on the same board, THE App SHALL reflect the change in the UI within 2 seconds
3. WHEN another user reorders columns or moves a card, THE App SHALL update the board layout without requiring a page refresh
4. WHEN the Realtime connection is lost, THE App SHALL display a connection status indicator and attempt to reconnect
5. WHEN the Realtime connection is re-established, THE App SHALL fetch the latest board state to resolve any missed updates

### Requirement 26: In-App Notification Center

**User Story:** As a user, I want to receive notifications for relevant events, so that I stay informed about task assignments and mentions.

#### Acceptance Criteria

1. WHEN a user is assigned to a task, THE Notification_Service SHALL create a notification record for that user
2. WHEN a comment is posted on a task the user is assigned to, THE Notification_Service SHALL create a notification record
3. WHEN a user is invited to a workspace, THE Notification_Service SHALL create a notification record
4. THE App SHALL display an unread notification count badge in the navigation bar
5. WHEN a user opens the notification center, THE App SHALL display notifications in reverse chronological order with read/unread status
6. WHEN a user clicks a notification, THE App SHALL navigate to the relevant resource (task, workspace, board) and mark the notification as read
7. THE App SHALL subscribe to Supabase Realtime for the notifications table to display new notifications immediately

### Requirement 27: Personal Dashboard

**User Story:** As a user, I want a personal dashboard showing my tasks across all boards, so that I can manage my workload in one place.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard, THE Dashboard_Service SHALL aggregate all tasks assigned to the user across all workspaces and boards
2. THE App SHALL display sections for: overdue tasks, tasks due today, tasks due this week, and upcoming tasks
3. THE App SHALL display the total count of assigned tasks grouped by priority
4. WHEN a user clicks a task on the dashboard, THE App SHALL navigate to the relevant board and open the task detail panel

### Requirement 28: Dark and Light Theme

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHEN a user selects a theme preference (dark, light, or system), THE Theme_Service SHALL persist the preference and apply the theme immediately
2. WHERE a user selects system theme preference, THE Theme_Service SHALL follow the operating system's preferred color scheme
3. THE App SHALL apply theme changes without a page reload using CSS custom properties
4. THE Theme_Service SHALL store the theme preference in localStorage and apply it on initial load before rendering

### Requirement 29: Keyboard Shortcuts

**User Story:** As a power user, I want keyboard shortcuts for common actions, so that I can navigate and operate the app efficiently.

#### Acceptance Criteria

1. THE App SHALL support keyboard shortcuts for: new task (N), search (Ctrl+K or Cmd+K), close panel (Escape), and navigate boards (B)
2. WHEN a user presses the shortcut help key (?), THE App SHALL display an overlay modal listing all available shortcuts
3. WHILE a text input or textarea is focused, THE App SHALL suppress single-key shortcuts to prevent interference with typing
4. THE App SHALL display shortcut hints in tooltips for relevant UI elements

### Requirement 30: Account Settings

**User Story:** As a user, I want to manage my account settings including sign-out, so that I can control my account.

#### Acceptance Criteria

1. WHEN a user navigates to /settings, THE App SHALL display account settings including email, notification preferences, and danger zone (delete account)
2. WHEN a user signs out, THE Auth_Service SHALL destroy the session, clear local storage, and redirect to the sign-in page
3. WHEN a user requests account deletion, THE App SHALL display a confirmation dialog requiring the user to type their email to confirm
4. WHEN account deletion is confirmed, THE Auth_Service SHALL delete the user's profile, remove workspace memberships, and delete the Supabase auth account

### Requirement 31: Sorting on Board

**User Story:** As a board member, I want to sort cards within a column, so that I can view tasks in a meaningful order.

#### Acceptance Criteria

1. WHEN a user selects a sort option (priority, due date, creation date, or alphabetical), THE App SHALL reorder cards within each column according to the selected criterion
2. THE App SHALL indicate the active sort order visually in the sort control
3. WHEN a user clears the sort, THE App SHALL return cards to their manual (position-based) order

### Requirement 32: Custom UI Directives and Components

**User Story:** As a developer, I want a consistent custom UI system with directives and components, so that the app has a cohesive design without external component libraries.

#### Acceptance Criteria

1. THE App SHALL provide an appButton directive supporting variants (primary, secondary, danger, ghost) and sizes (sm, md, lg)
2. THE App SHALL provide an appInput directive with consistent styling, validation states, and accessibility attributes (aria-label, aria-invalid)
3. THE App SHALL provide an appBadge directive supporting color variants for priority levels and labels
4. THE App SHALL provide an appTooltip directive that displays contextual help text on hover or focus
5. THE App SHALL provide reusable components: modal, dropdown, avatar, toast, confirm-dialog, spinner, and empty-state
6. THE App SHALL ensure all custom directives and components meet WCAG 2.1 AA accessibility standards including keyboard navigation and screen reader support

### Requirement 33: Responsive Layout and Navigation

**User Story:** As a user, I want the app to work well on different screen sizes, so that I can use it on desktop and tablet devices.

#### Acceptance Criteria

1. THE App SHALL provide a sidebar navigation with workspace switcher, board links, and user menu
2. WHEN the viewport width is below 768px, THE App SHALL collapse the sidebar into a hamburger menu
3. THE App SHALL maintain a minimum usable board width of 320px per visible column with horizontal scrolling for additional columns

### Requirement 34: Edge Function AI Proxy

**User Story:** As a developer, I want AI calls routed through Supabase Edge Functions, so that API keys remain secure and requests are validated.

#### Acceptance Criteria

1. THE Edge_Function SHALL validate the incoming request contains a valid Supabase auth token before calling OpenAI
2. THE Edge_Function SHALL forward only the text payload to OpenAI and return the structured response to the client
3. IF the OpenAI API returns an error, THEN THE Edge_Function SHALL return a standardized error response with an appropriate HTTP status code
4. THE Edge_Function SHALL enforce a rate limit of 20 AI requests per user per hour
5. THE Edge_Function SHALL not log or persist the user's text content beyond the request lifecycle

### Requirement 35: Data Serialization and State Management

**User Story:** As a developer, I want consistent data serialization between client and server, so that the app handles data transformations reliably.

#### Acceptance Criteria

1. THE App SHALL use Angular signals for all service-level state management without external state libraries
2. WHEN the App receives a JSON response from Supabase, THE App SHALL parse it into typed TypeScript interfaces
3. FOR ALL typed interfaces, serializing to JSON then parsing back SHALL produce an equivalent object (round-trip property)
4. THE App SHALL use computed signals for derived state (filtered tasks, sorted lists, aggregated counts)
5. THE App SHALL use effect() for side effects triggered by signal changes (persisting preferences, subscribing to realtime channels)

