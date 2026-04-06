# PRD: kanban-collab

---

## 1. MVP Scope

**Assumption resolutions before reading further:**
- Real-time = card movement and edits visible to connected users; NO live co-editing of descriptions.
- Hierarchy = Workspace → Board (flat, no Project tier in MVP). Project entity deferred.
- Notifications = in-app + email only. No Slack/webhook in v1.

---

### Feature 1: Kanban Board with Drag-and-Drop

Members can move cards across three fixed columns (To Do, In Progress, Done) on a board. Column set is fixed in MVP; customizable columns are post-MVP.

**Acceptance Criteria:**
- Card drops to target column and position within 500ms via optimistic UI update
- Server persists new `rank` and `column_id` within 2 seconds of drop
- If server write fails, card snaps back to original position and shows an inline error toast
- Card order within a column is deterministic; concurrent moves by two users resolve without silent data loss (last-write-wins via server-authoritative rank is acceptable in MVP)
- Column ordering uses integer rank stored on the Column record

**Out of scope:** Custom column names/count, WIP limits, swimlanes.

---

### Feature 2: User Auth and Workspace Creation with Invite-by-Email

Users register, verify email, create a Workspace, and invite others by email. MVP roles: Owner and Member only.

**Acceptance Criteria:**
- Registration requires email + password; unverified users cannot access any board
- Email verification token expires after 24 hours
- Workspace creation requires a unique slug (URL-safe, 3–40 chars)
- Owner can invite by email; invite record created with a signed token expiring in 7 days
- Invited user clicks link → account creation (if new) or login → lands on Workspace
- Expired invite click returns HTTP 410 with message "Invite expired. Request a new one."
- Owner can revoke pending invites

---

### Feature 3: Task Cards with Title, Description, Assignee, Due Date

Cards are the unit of work. Each card belongs to exactly one column.

**Acceptance Criteria:**
- Card requires title (1–255 chars); description is optional (plain text, max 10,000 chars)
- At most one assignee per card in MVP (CardAssignee table supports N:N for post-MVP)
- Due date is optional; stored as UTC date (no time component in MVP)
- Cards with a due date that has passed render a visual overdue indicator
- Archiving a card removes it from board view but retains it in the database with `archived_at` timestamp
- Deleting a column with cards requires user to confirm; cards are archived (not hard-deleted)

---

### Feature 4: Card Comments

Members can comment on cards for async collaboration.

**Acceptance Criteria:**
- Comment requires non-empty body (max 2,000 chars)
- Comment displays author name, avatar initial, and UTC timestamp (rendered in user's local timezone)
- Comment author can edit or delete their own comment; Owner can delete any comment
- Comments list is paginated: 20 per page, ordered oldest-first
- Viewer-role users can read comments but cannot post

---

### Feature 5: Real-Time Board Updates via WebSocket

All users with a board open receive live updates when any card is moved, created, updated, or archived.

**Acceptance Criteria:**
- Card movement propagates to all connected clients within 1 second under normal conditions
- Board renders in read-only mode (with a banner: "Live updates paused — reconnecting…") if WebSocket drops; no data loss on reconnect
- Server uses a Redis pub/sub channel per `board_id` to support multiple server instances
- Events broadcast: `card.moved`, `card.created`, `card.updated`, `card.archived`, `comment.created`

---

### OUT OF SCOPE for MVP (and why)

| Feature | Reason |
|---|---|
| Custom columns | Adds ordering complexity; fixed 3-column covers core workflow |
| Project tier (Workspace → Project → Board) | Adds navigation depth with no MVP user value |
| Labels, checklists, attachments | Increases data model surface; core loop works without them |
| Admin role | Owner/Member covers all MVP access patterns |
| Due date calendar view | Requires separate view layer; filter by due date on board is sufficient |
| Board templates | No boards exist to templatize yet; post-launch learning needed |
| CSV export | Not a blocker to adoption |
| Search | Requires indexing infrastructure; deferred to post-MVP |
| Slack/webhook notifications | Adds abstraction layer; email + in-app sufficient |
| Card activity log | Read-only audit; doesn't affect core loop |

---

## 2. Data Model

**User:** id (UUID), email (String, unique), password_hash (String), display_name (String), avatar_url (String?), email_verified_at (Timestamp?), created_at (Timestamp)

**Workspace:** id (UUID), name (String), slug (String, unique), created_by → User, created_at (Timestamp)

**WorkspaceMember:** id (UUID), workspace_id → Workspace, user_id → User, role (Enum: owner | member), joined_at (Timestamp)
- Cardinality: User N:N Workspace

**Invite:** id (UUID), workspace_id → Workspace, invited_email (String), token (String, unique), invited_by → User, expires_at (Timestamp), accepted_at (Timestamp?), revoked_at (Timestamp?)

**Board:** id (UUID), workspace_id → Workspace, name (String), created_by → User, archived_at (Timestamp?), created_at (Timestamp)
- Cardinality: Workspace 1:N Board

**Column:** id (UUID), board_id → Board, name (String), rank (Integer), is_system (Boolean, true for MVP fixed columns)
- Cardinality: Board 1:N Column (fixed 3 in MVP)

**Card:** id (UUID), column_id → Column, title (String), description (Text?), rank (String — LexoRank/fractional), due_date (Date?), assignee_id → User (nullable), archived_at (Timestamp?), created_by → User, created_at (Timestamp), updated_at (Timestamp)
- Cardinality: Column 1:N Card

**Comment:** id (UUID), card_id → Card, author_id → User, body (Text), edited_at (Timestamp?), deleted_at (Timestamp?), created_at (Timestamp)
- Cardinality: Card 1:N Comment

**Notification:** id (UUID), user_id → User, type (Enum: card_assigned | comment_posted | invite_received), reference_id (UUID), reference_type (String), read_at (Timestamp?), created_at (Timestamp)
- Cardinality: User 1:N Notification

---

## 3. Core User Flows

### Flow A: Invite and Onboard Teammate
1. Owner opens Workspace Settings → enters email → clicks Invite → `POST /workspaces/:id/invites` creates Invite record, sends email with signed token link
2. Recipient clicks link → system validates token and expiry → if valid, redirect to `/accept-invite?token=...`
3. If user has no account → registration form pre-filled with email → on submit, creates User + WorkspaceMember (role: member) + marks invite accepted
4. If user has account → login prompt → on auth, creates WorkspaceMember + marks invite accepted → redirect to Workspace
5. **Error:** Token expired → HTTP 410 response → UI shows "This invite has expired. Ask your workspace owner to resend." No account is created.

### Flow B: Move a Card (Real-Time)
1. Member drags card → UI applies optimistic position update immediately (card renders in new column/position)
2. `PATCH /cards/:id` sent with `{ column_id, rank }` → server validates member has write access
3. Server persists new rank → publishes `card.moved` event to Redis channel for `board_id`
4. All other connected clients receive WebSocket event → re-render card in new position
5. **Error:** Server returns 409 (rank conflict) → client re-fetches board state via `GET /boards/:id` → reconciles UI; shows no error to user (silent reconcile)

### Flow C: Assign a Card and Notify Assignee
1. Member opens card detail modal → clicks Assignee field → selects teammate from Workspace member list
2. `PATCH /cards/:id` with `{ assignee_id }` → server updates card → creates Notification record for assignee → enqueues email job
3. Assignee sees in-app notification badge increment → clicks notification → card detail modal opens at correct board
4. **Error:** Selected user is no longer a Workspace member (removed between page load and save) → server returns 422 → UI shows "This user is no longer in the workspace."

### Flow D: Delete Column with Cards
1. Owner or Admin clicks "Delete Column" → `GET /columns/:id/cards/count` returns card count
2. If count > 0: modal shows "This column has N cards. Move them to another column or they will be archived."
3. User selects target column from dropdown → clicks "Move and Delete" → `DELETE /columns/:id?move_cards_to=<column_id>`
4. If user clicks "Archive All and Delete" → `DELETE /columns/:id?archive_cards=true` → all cards get `archived_at` set, column deleted
5. **Error:** Target column also deleted between modal open and confirm → server returns 404 for target column → UI shows "Target column no longer exists. Please select another."

---

## 4. API Surface

**Auth**
- `POST /auth/register` — create user account
- `POST /auth/login` — return JWT access token + refresh token
- `POST /auth/refresh` — exchange refresh token for new access token
- `POST /auth/verify-email` — verify email with token
- `POST /auth/logout` — invalidate refresh token

**Workspaces**
- `POST /workspaces` — create workspace
- `GET /workspaces/:id` — get workspace + member list
- `POST /workspaces/:id/invites` — send invite email
- `DELETE /workspaces/:id/invites/:inviteId` — revoke invite
- `POST /invites/accept` — accept invite by token

**Boards**
- `GET /workspaces/:id/boards` — list boards in workspace
- `POST /workspaces/:id/boards` — create board
- `GET /boards/:id` — fetch board with all columns and cards (single request)
- `PATCH /boards/:id` — rename or archive board
- `DELETE /boards/:id` — delete board

**Columns**
- `PATCH /columns/:id` — rename column
- `DELETE /columns/:id` — delete column (params: `move_cards_to` or `archive_cards`)

**Cards**
- `POST /columns/:id/cards` — create card
- `GET /cards/:id` — fetch card detail
- `PATCH /cards/:id` — update title, description, assignee, due date, column, rank
- `DELETE /cards/:id` — archive card

**Comments**
- `GET /cards/:id/comments` — paginated comment list
- `POST /cards/:id/comments` — create comment
- `PATCH /comments/:id` — edit comment (author only)
- `DELETE /comments/:id` — soft-delete comment

**Notifications**
- `GET /notifications` — list unread notifications for authed user
- `PATCH /notifications/:id/read` — mark read
- `PATCH /notifications/read-all` — mark all read

---

## 5. Non-Functional Requirements

**Performance**
- `GET /boards/:id` (full board payload): p95 < 300ms; payload cap at 500 cards per board before pagination is required (plan for this in schema, not implemented in MVP)
- WebSocket event delivery: < 1 second p95 for all connected clients on same board
- API endpoints (non-board-load): p95 < 150ms
- Target: 200 concurrent users across all boards at launch

**Security**
- Auth: JWT (access token 15min TTL) + httpOnly cookie refresh token (7-day TTL)
- All board/card/comment endpoints validate WorkspaceMember record; no resource is accessible outside the requester's workspace
- Viewer role enforced server-side on all mutating endpoints (not just UI)
- Invite tokens are signed (HMAC-SHA256); raw token never stored, only hash stored in DB
- File uploads (post-MVP): server-side MIME validation + size enforcement at API layer, not just client

**Scalability constraint affecting architecture**
- WebSocket server must use Redis pub/sub (one channel per `board_id`) to allow horizontal scaling from day one. Do not use in-process event emitter.
- Email delivery must go through a job queue (BullMQ or equivalent); never inline in request handler. Email provider: SendGrid or Postmark (transactional).

---

## 6. What We're NOT Building

| Feature | Why not |
|---|---|
| Live co-editing of card descriptions | Requires CRDT/OT (e.g., Yjs); order-of-magnitude complexity increase. Async comments serve the same collaboration need for MVP. |
| Project tier (Workspace → Project → Board) | Adds navigation hierarchy users haven't requested yet. Flat board list per workspace is sufficient; Project layer can be added as a grouping abstraction post-launch based on usage. |
| Custom columns (add/rename/reorder) | Fixed 3 columns eliminate rank-conflict surface area for MVP. Full column management ships when fractional indexing (LexoRank) is validated in production. |
| Labels and card filtering | Useful but not required to complete a task. Adds UI complexity (filter state, label CRUD) with no MVP workflow dependency. |
| Checklists | Sub-task decomposition is a power-user feature. Description field covers the need at MVP scale. |
| Attachments | Requires file storage integration (S3/R2), CDN, MIME validation pipeline. Deferred until core workflow is validated. |
| Admin role | Owner and Member cover all MVP permission scenarios. Admin (partial delete/invite rights) adds permission logic without clear MVP value. |
| Search | Requires full-text index (Postgres `tsvector` or Elasticsearch). Not a blocker when board card count is low. |
| Board templates | No usage data to determine which templates have value. Templates created post-launch from real user boards. |
| Slack / webhook integrations | Requires a notification abstraction layer (provider-agnostic event routing). Adds infrastructure complexity before core retention is established. |
| CSV export | Operational convenience feature. No architectural dependency; add post-MVP in one endpoint. |
| Calendar / due date view | Separate view with its own navigation model. Due date field on card + overdue indicator covers MVP urgency signaling. |