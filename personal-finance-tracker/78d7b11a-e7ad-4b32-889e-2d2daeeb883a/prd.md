# Personal Finance Tracker — PRD

---

## 1. MVP Scope

**Assumption locks (unresolved questions defaulted for MVP):** Single user per account. Budgets reset to zero monthly (no rollover). No bank API integration — fully manual entry only.

---

### Feature 1: Authentication + Data Isolation
Each user account has its own isolated data space. No data is readable or writable across accounts.

**Acceptance Criteria:**
- POST `/auth/register` creates a user and returns a JWT
- POST `/auth/login` returns a JWT; invalid credentials return 401
- All data queries include `user_id` as a mandatory filter at the ORM/query layer
- A valid JWT for User A cannot retrieve any Transaction, Category, or Budget belonging to User B (verified via automated API test)
- JWT expires after 7 days; expired tokens return 401

---

### Feature 2: Manual Transaction Entry
User logs a single transaction with amount, date, category, type (income/expense), and optional notes.

**Acceptance Criteria:**
- Transaction requires: `amount` (positive integer, cents), `date` (ISO 8601), `category_id` (must belong to same user), `type` (INCOME | EXPENSE)
- `notes` is optional, max 500 chars
- Transaction entry completable in ≤4 user interactions from dashboard
- Saving a transaction triggers a re-fetch of budget progress for the affected category without full page reload
- If `amount` would push category monthly spend to ≥90% of its `limit_cents`, an inline warning renders before save is confirmed — save is still permitted

---

### Feature 3: Budget Categories with Monthly Limits
Users can use system-default categories or create custom ones, each with an optional monthly spending limit.

**Acceptance Criteria:**
- System seeds 10 default categories on account creation (e.g., Housing, Food, Transport, Utilities, Health, Entertainment, Income, Savings, Clothing, Other)
- User can create a custom category with: `name` (unique per user), `type` (INCOME | EXPENSE), `limit_cents` (optional)
- User can edit `name` and `limit_cents` on any category they own
- Deleting a category with linked transactions returns a 409 with count of linked transactions; deletion blocked until transactions are reassigned
- Categories without a `limit_cents` appear in budget view as "No limit set" and are excluded from progress bar rendering

---

### Feature 4: Budget Progress View
Displays spent vs. limit per category for a user-selected month.

**Acceptance Criteria:**
- Defaults to current calendar month on load
- User can select any past or current month via a month picker; future months render with $0 spent
- Each EXPENSE category shows: `spent_cents`, `limit_cents` (if set), and percentage consumed
- Progress bar renders at 0–100% (capped visually at 100%; over-limit state uses a distinct color)
- Categories with no transactions in the selected month still appear if they have a `limit_cents` set
- Page load for budget view with ≤1,000 transactions renders within 500ms (measured at API response time)

---

### Feature 5: Spending Charts
Two charts: pie chart (spending by category, current or selected month) and bar chart (monthly category totals, trailing 6 months).

**Acceptance Criteria:**
- Pie chart shows EXPENSE transactions only, sliced by category, for the selected month
- Bar chart shows one bar group per month for trailing 6 months, stacked or grouped by category
- Both charts re-render when month picker changes, without full page reload
- Hovering/tapping a pie slice filters the transaction list below to that category (drill-down)
- Charts render within 500ms of data fetch completing
- Categories with $0 spend are excluded from pie chart; included in bar chart as zero-height bars

---

### Out of Scope for MVP

| Feature | Reason |
|---|---|
| CSV import | User-guided column mapping is a standalone UI project; deferred to v2 |
| Recurring transactions | Architectural ambiguity (eager vs. lazy generation) requires a dedicated decision spike |
| Multi-currency | Exchange rate API dependency adds failure modes; single currency keeps MVP deterministic |
| Savings goals | No user research validating priority over core budget tracking |
| Split transactions | Complicates budget rollup queries; deferred until core aggregation is proven stable |
| Notifications/alerts | Requires background job infrastructure; inline warnings cover the MVP need |
| Search and filter | Deferred to v2; drill-down from charts partially addresses this |

---

## 2. Data Model

**User:** `id` (UUID), `email` (String, unique), `password_hash` (String), `created_at` (Timestamp), `timezone` (String, IANA tz, default "UTC")

**Category:** `id` (UUID), `user_id` (UUID → User), `name` (String), `type` (Enum: INCOME | EXPENSE), `limit_cents` (Integer, nullable), `is_default` (Boolean), `created_at` (Timestamp)
- Relationship: User 1:N Category

**Transaction:** `id` (UUID), `user_id` (UUID → User), `category_id` (UUID → Category), `amount_cents` (Integer, positive), `type` (Enum: INCOME | EXPENSE), `date` (Date, timezone-resolved to user's tz), `notes` (String, nullable, max 500), `created_at` (Timestamp)
- Relationship: User 1:N Transaction; Category 1:N Transaction

**MonthlyBudgetSummary (materialized/cache):** `user_id` (UUID → User), `category_id` (UUID → Category), `year_month` (String, "YYYY-MM"), `spent_cents` (Integer)
- Composite key: `(user_id, category_id, year_month)`
- Populated by insert/update/delete triggers on Transaction; used to power budget progress view and charts without full aggregation on each request

**Indexes required:**
- `Transaction(user_id, category_id, date)` — composite index
- `Transaction(user_id, date)` — for monthly filtering
- `Category(user_id)` — for user-scoped lookups

**Cardinality summary:** User → Category (1:N), User → Transaction (1:N), Category → Transaction (1:N), User+Category+YearMonth → MonthlyBudgetSummary (1:1)

---

## 3. Core User Flows

### Flow A: Add a Transaction
1. User opens dashboard → clicks "Add Transaction" (1 interaction)
2. Form renders with fields: amount, date (defaults today), category (dropdown), type, notes
3. User fills form → selects category → enters amount (2–3 interactions)
4. System queries `MonthlyBudgetSummary` for the selected category + current month
5. If `(existing_spent + new_amount) / limit_cents ≥ 0.90` AND `limit_cents` is set → inline warning renders: "This will bring you to X% of your [Category] budget"
6. User confirms → POST `/transactions` → 201 response
7. System updates `MonthlyBudgetSummary` row for affected `(user_id, category_id, year_month)`
8. Budget progress bar and charts re-render via re-fetch (no full page reload)
9. **Error:** If `category_id` does not belong to `user_id` → 403; form shows "Invalid category"
10. **Error:** If `amount` is non-positive or non-numeric → 400; field highlighted with "Amount must be greater than 0"

### Flow B: View Budget Progress for a Past Month
1. User navigates to Budget view → month picker defaults to current month
2. User selects a past month → GET `/budgets/summary?year_month=YYYY-MM`
3. System returns all categories with `limit_cents` set + `spent_cents` from `MonthlyBudgetSummary`
4. Progress bars render; categories with `spent_cents = 0` but `limit_cents > 0` render at 0%
5. **Edge case:** User selects a future month → all `spent_cents` return 0; progress bars render at 0% with informational note "No transactions recorded yet"

### Flow C: Delete a Category with Existing Transactions
1. User navigates to Categories → clicks delete on a category
2. System queries `Transaction` count where `category_id` matches
3. If count > 0 → return 409: "This category has 12 transactions. Reassign them before deleting."
4. Modal prompts user to select a replacement category from their category list
5. User selects replacement → PATCH `/categories/{id}/reassign` with `target_category_id`
6. System updates all matching transactions to `target_category_id`, updates affected `MonthlyBudgetSummary` rows
7. DELETE `/categories/{id}` now succeeds → 204
8. **Error:** If `target_category_id` does not belong to user → 403

---

## 4. API Surface

**Auth**
- `POST /auth/register` — create account, return JWT
- `POST /auth/login` — authenticate, return JWT

**Categories**
- `GET /categories` — list all categories for authenticated user
- `POST /categories` — create custom category
- `PATCH /categories/{id}` — update name or limit
- `DELETE /categories/{id}` — delete (blocked if transactions exist)
- `PATCH /categories/{id}/reassign` — bulk reassign transactions to another category

**Transactions**
- `GET /transactions?year_month=&category_id=` — list transactions with filters
- `POST /transactions` — create transaction
- `PATCH /transactions/{id}` — edit transaction
- `DELETE /transactions/{id}` — delete transaction

**Budgets**
- `GET /budgets/summary?year_month=YYYY-MM` — return spent vs. limit per category for given month

**Charts**
- `GET /charts/pie?year_month=YYYY-MM` — category spend breakdown for month
- `GET /charts/bar?months=6` — monthly totals by category, trailing N months

---

## 5. Non-Functional Requirements

**Performance**
- Budget summary API response: ≤500ms at p95 for users with ≤1,000 transactions (achieved via `MonthlyBudgetSummary` read; not real-time aggregation)
- Chart API response: ≤500ms at p95 for trailing 6 months of data
- Target: 100 concurrent users without degradation (single-server MVP scale)

**Security**
- Auth: JWT (HS256), 7-day expiry, no refresh tokens in MVP
- All endpoints require valid JWT; `user_id` extracted from token, never from request body
- Passwords hashed with bcrypt, cost factor ≥12
- All monetary values stored as integers (cents) — no floats in DB or API responses
- HTTPS enforced; no sensitive data in query params

**Timezone Handling**
- `User.timezone` stored on account creation; defaults to "UTC"
- Transaction `date` stored as a calendar date (not timestamp); month assignment computed using user's timezone to determine which `year_month` a transaction belongs to

---

## 6. What We're NOT Building

| Feature | Why excluded |
|---|---|
| Bank API sync (Plaid) | Requires OAuth flow, webhook infrastructure, and deduplication logic against manual entries — a separate product surface |
| Recurring transactions | Eager vs. lazy generation trade-off unresolved; incorrect choice creates debt affecting editing UX and storage. Needs a spike before building |
| Multi-currency | Requires exchange rate API, failure handling, and currency-aware aggregation. Adds complexity disproportionate to MVP value |
| CSV import | No standard bank export format; user-guided field mapping is a significant standalone UX problem. Validated manual entry first |
| Savings goals | No user research confirming this is higher priority than improving core budget tracking. Deferred pending feedback |
| Split transactions | Partial amounts in budget rollup queries require rewriting aggregation logic. Deferred until `MonthlyBudgetSummary` approach is proven |
| Shared/household accounts | Changes ownership model for Budget and Category entities fundamentally. Single-user model locked for MVP; revisit based on demand |
| Mobile native app | Web-responsive MVP only; native adds distribution and platform maintenance overhead before product-market fit |