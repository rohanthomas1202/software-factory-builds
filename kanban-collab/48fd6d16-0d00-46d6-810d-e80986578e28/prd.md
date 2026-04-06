# PRD: kanban-collab

## 1. MVP Scope

**Decision baseline:** Collaboration is workspace-scoped (all workspace members see all projects). Offline support is out. Conflict resolution is last-write-wins. No swimlanes.

---

### Feature 1: Kanban Board with Drag-and-Drop
A single board renders columns containing cards; users reorder cards within columns and move cards between columns via drag-and-drop.

- Board loads all columns and cards in a single GET response
- Drag-and-drop updates card's `columnId` and `sortOrder` (fractional indexing via `position` float) without full re-render
- Card position persists across page refresh
- Board renders 500 cards across columns with no frame drops below 30fps (measured via Chrome DevTools)
- `position` field uses lexicographic string keys (e.g., LexoRank or similar) to avoid re-index storms on reorder

### Feature 2: Task Cards
A card stores the minimum actionable metadata: title, description, assignee(s), due date, priority.

- Card can be created from board view in ≤3 clicks
- Fields: title (required, max 255 chars), description (markdown, max 10k chars), assignee (single User for MVP), dueDate (nullable ISO 8601), priority (enum: Low/Medium/High/Critical)
- Card detail opens as a modal/drawer without route change
- Editing any field auto-saves with debounce ≤500ms; no explicit save button required

### Feature 3: Team Workspace with Invite
A Workspace groups users; the Owner invites members by email; invited users join with Member role.

- Owner can invite via email address input; invite record created with 7-day expiry token
- Invite email delivered within 60 seconds (tested via test inbox)
- Invited user lands on accept page, registers or logs in, and is added as WorkspaceMember with role=Member
- Only Owner can invite or remove members for MVP
- Workspace enforces no seat limit in MVP (seat limit feature is out of scope)

### Feature 4: Real-Time Board Sync
All users viewing the same board receive card move, card create, card update, and card delete events within 300ms p95.

- WebSocket connection established on board page mount; reconnects automatically on disconnect
- Events broadcast per board room via Redis pub/sub
- Client applies incoming events to local board state without full re-fetch
- If two users move the same card simultaneously, last write (by server timestamp) wins; no merge UI required

### Feature 5: Comment Threads on Cards
Users post comments on a card; @mentions trigger in-app notifications.

- Comments rendered in chronological order on card detail view
- Comment supports plain text with @username mention syntax (no rich text for MVP)
- @mention parses workspace members matching the typed string; inserts `@userId` reference stored in comment body
- Mentioned user receives in-app notification linking to card with comment scroll position anchored
- Comment edit and delete limited to comment author

---

### Out of Scope for MVP

| Feature | Reason |
|---|---|
| Multiple boards per project | Single board per project simplifies data model; multi-board adds nav complexity |
| Labels / card filtering | Adds UI surface and query complexity; core loop doesn't require it |
| File attachments | S3 integration + 10MB handling is non-trivial; zero user value until core loop works |
| Checklists/subtasks | Nested state management; not needed to validate collaboration loop |
| Email notifications | SMTP/transactional email service setup; in-app notifications cover MVP |
| Activity log | Append-only log grows unbounded; needs pagination design before shipping |
| Board templates | Requires template engine; zero value until users have repeated workflow patterns |
| Admin role | Binary Owner/Member sufficient for MVP; Admin is a premature permission layer |

---

## 2. Data Model

**MVP entities only:**

```
User: id (UUID PK), email (String UNIQUE), passwordHash (String), displayName (String), avatarUrl (String nullable), createdAt (Timestamp)

Workspace: id (UUID PK), name (String), slug (String UNIQUE), ownerId (UUID → User), createdAt (Timestamp)

WorkspaceMember: id (UUID PK), workspaceId (UUID → Workspace), userId (UUID → User), role (Enum: Owner|Member), joinedAt (Timestamp)
  Relationship: User N:N Workspace; unique constraint on (workspaceId, userId)

WorkspaceInvite: id (UUID PK), workspaceId (UUID → Workspace), invitedEmail (String), token (String UNIQUE), role (Enum: Member), expiresAt (Timestamp), acceptedAt (Timestamp nullable), invitedByUserId (UUID → User)

Project: id (UUID PK), workspaceId (UUID → Workspace), name (String), createdByUserId (UUID → User), createdAt (Timestamp)
  Relationship: Workspace 1:N Project

Board: id (UUID PK), projectId (UUID → Project), name (String), createdAt (Timestamp)
  Relationship: Project 1:N Board (MVP: 1 board per project enforced at application layer)

Column: id (UUID PK), boardId (UUID → Board), name (String), position (String — LexoRank), createdAt (Timestamp)
  Relationship: Board 1:N Column

Card: id (UUID PK), columnId (UUID → Column), boardId (UUID → Board — denormalized for query efficiency), title (String), description (Text nullable), assigneeId (UUID → User nullable), dueDate (Date nullable), priority (Enum: Low|Medium|High|Critical), position (String — LexoRank), archived (Boolean default false), createdByUserId (UUID → User), createdAt (Timestamp), updatedAt (Timestamp)
  Relationship: Column 1:N Card

Comment: id (UUID PK), cardId (UUID → Card), authorId (UUID → User), body (String — plain text with @userId tokens), createdAt (Timestamp), editedAt (Timestamp nullable), deletedAt (Timestamp nullable — soft delete)
  Relationship: Card 1:N Comment; Comment N:1 User

Notification: id (UUID PK), userId (UUID → User), type (Enum: mention), referenceCardId (UUID → Card), referenceCommentId (UUID → Comment nullable), read (Boolean default false), createdAt (Timestamp)
  Relationship: User 1:N Notification
```

**Key constraints:**
- `position` on Card and Column uses LexoRank (string-based fractional indexing); never integer sequence
- `boardId` on Card is denormalized to avoid Column join on every board load
- Soft delete on Comment via `deletedAt`; Card uses `archived` flag — no hard deletes on either

---

## 3. Core User Flows

### Flow A: Onboarding and Workspace Setup
1. User submits signup form (email, password, displayName) → system creates User, sends verification email
2. User clicks verification link → email marked verified → redirect to "Create Workspace" screen
3. User submits workspace name → system creates Workspace + WorkspaceMember(role=Owner) → redirect to workspace home
4. Owner enters invitee email → system creates WorkspaceInvite, sends invite email with token link
5. Invitee clicks link → if token expired, show "Invite expired, request a new one" → else redirect to register/login
6. Invitee completes auth → WorkspaceMember created (role=Member) → redirect to workspace home
7. **Edge case:** Invitee already a WorkspaceMember → accept page shows "You're already a member" → redirect to workspace home

### Flow B: Create Card and Assign
1. Member opens Board → clicks "Add card" in a Column → inline title input appears
2. Member types title, presses Enter → Card created (POST /cards), rendered at bottom of Column
3. Member clicks card → card detail drawer opens → sets assignee, due date, priority via dropdowns
4. Each field change triggers PATCH /cards/:id → WebSocket event broadcast to board room
5. Assigned user sees notification badge increment if not currently viewing the board
6. **Edge case:** Title submitted empty → client validation blocks submission, input shakes, no API call made

### Flow C: Drag-and-Drop Card Move
1. Member drags Card from Column A to Column B, position 3 of 5
2. Client computes new `position` (LexoRank between adjacent cards) and new `columnId`
3. Client optimistically updates local state → PATCH /cards/:id sent with `{columnId, position}`
4. Server persists change → broadcasts `card.moved` event to board room with `{cardId, columnId, position}`
5. All other board viewers receive event → apply update to their local state without re-fetch
6. **Edge case:** Server returns 409 (concurrent move conflict) → client re-fetches card state for that card only, applies server position (last-write-wins)

### Flow D: @Mention in Comment
1. Member opens card detail → types comment body, types "@" → dropdown shows workspace members matching subsequent chars
2. Member selects user → mention token `@{userId}` inserted into body
3. Member submits comment → POST /comments → server parses body for `@{userId}` tokens
4. For each valid userId found, server creates Notification(type=mention, userId=mentionedUserId)
5. Mentioned user's client receives notification via WebSocket push → badge increments
6. Mentioned user clicks notification → navigates to /board/:boardId/card/:cardId?commentId=:commentId → comment scrolled into view
7. **Edge case:** @mention references a userId not in the workspace → server strips token, no notification created, comment saved with sanitized body

---

## 4. API Surface

**Auth**
- `POST /auth/register` — create user account
- `POST /auth/login` — return JWT access token + refresh token
- `POST /auth/refresh` — exchange refresh token for new access token
- `POST /auth/verify-email` — verify email token
- `GET /auth/me` — return current user profile

**Workspaces**
- `POST /workspaces` — create workspace (caller becomes Owner)
- `GET /workspaces/:id` — get workspace detail + member list
- `POST /workspaces/:id/invites` — send email invite
- `POST /workspaces/invites/:token/accept` — accept invite
- `DELETE /workspaces/:id/members/:userId` — remove member (Owner only)

**Projects & Boards**
- `POST /workspaces/:id/projects` — create project
- `GET /workspaces/:id/projects` — list projects
- `POST /projects/:id/boards` — create board
- `GET /boards/:id` — fetch board with all columns and cards (single payload)

**Columns**
- `POST /boards/:id/columns` — create column
- `PATCH /columns/:id` — rename or reposition column
- `DELETE /columns/:id` — delete column (requires cards to be empty or archived first)

**Cards**
- `POST /columns/:id/cards` — create card
- `GET /cards/:id` — fetch card detail
- `PATCH /cards/:id` — update any card field (title, description, assignee, dueDate, priority, columnId, position, archived)
- `DELETE /cards/:id` — archive card (sets archived=true, not hard delete)

**Comments**
- `POST /cards/:id/comments` — create comment, triggers mention notifications
- `GET /cards/:id/comments` — list comments (paginated, 50/page)
- `PATCH /comments/:id` — edit comment (author only)
- `DELETE /comments/:id` — soft delete comment (author only)

**Notifications**
- `GET /notifications` — list current user notifications (unread first, paginated)
- `PATCH /notifications/:id/read` — mark notification read
- `PATCH /notifications/read-all` — mark all read

**WebSocket**
- `WS /ws/boards/:id` — subscribe to board room; receives events: `card.created`, `card.moved`, `card.updated`, `card.archived`, `column.created`, `column.updated`, `comment.created`

---

## 5. Non-Functional Requirements

**Performance**
- `GET /boards/:id` response ≤200ms p95 for boards with ≤500 cards (requires denormalized `boardId` on Card + compound index on `(boardId, archived)`)
- WebSocket event delivery ≤300ms p95 for clients in same region; requires Redis pub/sub between server instances — do not use single-process in-memory event bus
- Board UI renders 500 cards without scroll jank; virtualize column card lists if card count exceeds 100 per column
- API write endpoints (PATCH, POST) ≤150ms p95 excluding network

**Security**
- Auth: JWT access tokens (15min expiry) + httpOnly cookie refresh tokens (7 days)
- All board/card/comment endpoints validate requesting user is a WorkspaceMember of the resource's workspace — no resource is publicly accessible
- Invite tokens are single-use UUIDs; mark used on accept regardless of outcome
- Comment `body` stored as-is but rendered with HTML escaping on client; no server-side HTML stored

**Scalability constraint affecting architecture**
- WebSocket server must be stateless per connection; board room pub/sub via Redis so any server instance can handle any client — required before multi-instance deployment

---

## 6. What We're NOT Building

| Feature | Reason |
|---|---|
| Swimlane / 2D board layout | Requires 2D card position model (row + column); breaks current `position` field design; needs user research on whether teams actually use it |
| Offline support / optimistic rollback | Requires client-side event queue, conflict reconciliation, and service worker; triples frontend architecture complexity |
| File attachments | S3 presigned URL flow, MIME validation, and 10MB cap enforcement add infrastructure scope; no user value until core loop is validated |
| Email notifications (due date reminders) | Requires transactional email provider integration, cron/job scheduler, and unsubscribe flow to meet CAN-SPAM; post-MVP |
| Activity log per card/board | Append-only table with unbounded growth; needs pagination and archival strategy before it can ship without query degradation |
| Board templates | Requires template snapshot/clone mechanism; only valuable once users have established repeated workflows |
| Admin role (RBAC beyond Owner/Member) | Premature; permission model should be validated with real teams before adding granularity |
| Per-project member scoping | Workspace-scoped membership chosen for MVP; per-project ACL requires a second join table and complicates every authorization check |
| Mobile native app | Web-first; drag-and-drop on mobile requires separate interaction model (tap-to-move); separate project scope |