# Personal Finance Tracker — PRD

---

## 1. MVP Scope

**MVP constitutes these 5 features. Nothing else ships in v1.**

---

### Feature 1: Budget Category Management
User creates named categories with a monthly spending limit and an optional color label.

**Acceptance Criteria:**
- POST `/categories` creates a category with `name` (required, unique per user), `monthly_limit_cents` (required, integer ≥ 0), `color_hex` (optional)
- GET `/categories` returns all categories for the authenticated user
- Deleting a category with associated transactions returns a 409 with count of blocking transactions before deletion proceeds
- `monthly_limit_cents` stored and returned as integer; any decimal input rejected with 400

---

### Feature 2: Manual Transaction Entry
User logs a single transaction: amount, date, type (INCOME/EXPENSE), category, optional note.

**Acceptance Criteria:**
- Transaction form completable in ≤ 4 user interactions (field fills + submit)
- `amount_cents` stored as integer; decimal input coerced to cents at validation layer, not client
- `transaction_date` stored in UTC, derived from user's timezone (timezone captured at registration)
- INCOME transactions do not require a category (nullable FK); EXPENSE transactions require one
- Transaction appears in the monthly list within 500ms of confirmation without full page reload

---

### Feature 3: Dashboard — Spending vs. Budget + Pie Chart
Dashboard displays: (a) per-category progress bars showing `spent / monthly_limit_cents` for the current calendar month, (b) pie chart of expense breakdown by category for the current month, (c) three summary figures: total income, total expenses, net balance.

**Acceptance Criteria:**
- Dashboard renders fully (charts painted, not loading spinners) in ≤ 2 seconds for a dataset of 3,600 transactions
- Categories over 90% of limit render progress bar in warning state (amber); over 100% in error state (red)
- Pie chart only includes EXPENSE transactions; INCOME not represented
- All three summary figures computed server-side and returned in one API call
- Selecting a pie segment navigates to the transaction list filtered to that category + current month

---

### Feature 4: Monthly Transaction List with Filtering
Paginated list of transactions filterable by category and date range, defaulting to current calendar month.

**Acceptance Criteria:**
- Filter by: category (multi-select), date range (start_date, end_date), transaction type (INCOME/EXPENSE)
- List is paginated: 50 transactions per page
- Each row shows: date, description/note, category, amount, type
- Inline edit of note and category on any transaction; amount and date require opening full edit form
- Applying a filter updates URL query params so the filtered state is shareable/bookmarkable

---

### Feature 5: Running Monthly Totals
Server computes and returns total income, total expenses, and net balance for any queried month.

**Acceptance Criteria:**
- Endpoint accepts `year` + `month` params; defaults to current calendar month in user's timezone
- Totals are integer cents; API response includes a `currency` field (hardcoded `USD` for MVP)
- Totals recompute on every transaction write (no stale cache served within the same session)

---

### Out of Scope for MVP

| Feature | Reason |
|---|---|
| CSV import | Parser complexity varies by bank format; needs its own scoping spike |
| Recurring transaction templates | Adds scheduler infrastructure; not needed for core tracking loop |
| Budget rollover | Requires MonthlyBudgetSnapshot pre-computation; architectural choice deferred |
| Multi-currency | Exchange rate management is a separate product problem |
| Email/notification alerts | Requires async job infra; deliver value first |
| Savings goals | Needs user research on how goals link to categories |
| Trend line charts (3/6/12 month) | MVP needs only current month; historical charts added in v2 |

---

## 2. Data Model

**User:** `id` (UUID), `email` (String, unique), `password_hash` (String), `timezone` (String, IANA tz, e.g. "America/New_York"), `created_at` (Timestamp)

**BudgetCategory:** `id` (UUID), `user_id` (UUID → User), `name` (String), `monthly_limit_cents` (Integer, ≥ 0), `color_hex` (String, nullable), `created_at` (Timestamp)
- Constraint: `(user_id, name)` unique

**Transaction:** `id` (UUID), `user_id` (UUID → User), `category_id` (UUID → BudgetCategory, nullable), `type` (Enum: INCOME | EXPENSE), `amount_cents` (Integer, > 0), `transaction_date` (Date, stored in UTC), `note` (String, nullable), `created_at` (Timestamp)
- Constraint: `category_id` NOT NULL when `type = EXPENSE`

**Cardinality:**
- User 1:N BudgetCategory
- User 1:N Transaction
- BudgetCategory 1:N Transaction (nullable; INCOME transactions exempt)

**Deferred entities** (not in MVP schema but flag for day-one field inclusion):
- Transaction needs `external_id` (String, nullable) and `import_source` (String, nullable) columns added now — zero cost, prevents painful migration when CSV import or Plaid sync is added
- If multi-user households are ever required, a `workspace_id` FK on User, BudgetCategory, and Transaction must be added before any data exists

---

## 3. Core User Flows

### Flow 1: First-Time Setup → Dashboard
1. User registers with email, password, timezone → account created, JWT issued
2. Redirected to category setup screen → user creates ≥ 1 category with a spending limit
3. User adds first transaction → selects category, enters amount, date, type
4. System saves transaction → redirects to dashboard
5. Dashboard renders with progress bar for the category showing `amount / limit`
6. **Edge case:** User skips category creation and tries to add an EXPENSE transaction → form blocks submission, inline error: "Create a category first to log expenses"

### Flow 2: Add Transaction → Budget Warning
1. User opens transaction form → enters amount, date, selects category, selects EXPENSE
2. User submits → system writes to DB → recalculates category spend for current month
3. If new total ≥ 90% of `monthly_limit_cents` → dashboard progress bar renders in amber; inline toast: "You've used 90% of [Category] budget"
4. If new total > 100% → progress bar renders red; toast: "Over budget in [Category]"
5. **Edge case:** User submits with `amount_cents = 0` → rejected at validation with 400: "Amount must be greater than zero"

### Flow 3: Delete Category with Existing Transactions
1. User selects a category → clicks Delete
2. System queries transaction count for that category → if count > 0, returns 409
3. UI displays modal: "This category has {N} transactions. Reassign them or delete all."
4. User selects a replacement category from dropdown → clicks Confirm Reassign
5. System bulk-updates all transactions to new `category_id` → deletes original category → returns 200
6. **Edge case:** User has only one category → no valid reassignment target → UI disables reassign option, shows: "Create another category before deleting this one"

### Flow 4: Filter Transaction List and Drill-Down from Chart
1. User is on dashboard → clicks a pie chart segment for category "Groceries"
2. System navigates to `/transactions?category=<id>&month=2024-11`
3. Transaction list renders pre-filtered to Groceries, current month
4. User clicks a row's note field → edits inline → presses Enter → PATCH sent
5. List reflects update; dashboard totals refetch in background
6. **Edge case:** Filter returns 0 results → empty state displayed: "No transactions match these filters" with a "Clear filters" link

---

## 4. API Surface

**Auth**
- `POST /auth/register` — create user, return JWT
- `POST /auth/login` — validate credentials, return JWT
- `POST /auth/logout` — invalidate token (server-side blocklist or short-lived JWT)

**Categories**
- `GET /categories` — list all for authenticated user
- `POST /categories` — create category
- `PATCH /categories/:id` — update name, limit, color
- `DELETE /categories/:id` — delete; returns 409 if transactions exist, else 200

**Transactions**
- `GET /transactions` — paginated list; query params: `category_id`, `start_date`, `end_date`, `type`, `page`
- `POST /transactions` — create transaction
- `PATCH /transactions/:id` — update fields
- `DELETE /transactions/:id` — delete

**Dashboard / Aggregates**
- `GET /dashboard/summary?year=&month=` — returns: per-category `{spent_cents, limit_cents, pct}` array, pie chart data, `total_income_cents`, `total_expenses_cents`, `net_balance_cents`

---

## 5. Non-Functional Requirements

**Performance**
- `GET /dashboard/summary` p95 ≤ 300ms for a user with 3,600 transactions
- Dashboard fully rendered in browser ≤ 2 seconds on a 10Mbps connection
- `GET /transactions` (paginated) p95 ≤ 150ms
- System must handle 50 concurrent users without degradation (MVP scale)

**Architectural implication:** Aggregate queries over raw transactions must be benchmarked at 3,600 rows before launch. If they breach 300ms, pre-compute `MonthlyBudgetSnapshot` (category totals written at transaction-write time). Do not pre-optimize before measuring.

**Security**
- JWT authentication, tokens expire in 24 hours
- All endpoints require authentication except `/auth/register` and `/auth/login`
- `user_id` enforced server-side on every query — no client-supplied user ID trusted
- `amount_cents` and `monthly_limit_cents` validated as integers at ORM layer; no float arithmetic in any budget calculation path

**Data Integrity**
- All monetary values are integers (cents). Floats never written to or read from the DB for financial fields. Input coercion (e.g., "$12.50" → 1250) happens in the validation layer with a defined rounding rule (round half-up).
- `transaction_date` stored as UTC DATE. Monthly bucketing computed using user's `timezone` field, not server timezone.

---

## 6. What We're NOT Building

| Feature | Why Not |
|---|---|
| **CSV/bank import** | Bank CSV formats are not standardized. A parser that works for Chase fails for Amex. Requires a format-preset library or ML categorization — a separate project. |
| **Budget period customization** (biweekly, rolling 30-day) | Changes every aggregation query and the snapshot schema. Calendar month is the correct default to ship and learn from. |
| **Recurring transaction templates** | Requires a job scheduler (cron/queue). Adds infra complexity before we know if users need it or prefer manual entry. |
| **Multi-user / household sharing** | Requires a Workspace entity, permission model, and conflict resolution. Single-user scope is sufficient to validate the core loop. |
| **Bank sync (Plaid / Open Banking)** | OAuth flows, webhook handling, deduplication logic. Explicitly out of scope; Transaction schema already includes `external_id` to avoid a migration later. |
| **Budget rollover** | Requires MonthlyBudgetSnapshot to be a first-class written record, not a derived query. Architectural commitment with unclear user value until v1 is used. |
| **Mobile native app** | Responsive web covers MVP. Native adds two separate codebases before product-market fit. |
| **Savings goals** | It's unclear whether goals should be category-linked, standalone, or date-bounded. Needs user research before we can define the data model. |