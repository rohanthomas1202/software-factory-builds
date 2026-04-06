# PRD: freelance-invoice-saas

---

## 1. MVP Scope

**MVP = the minimum surface a freelancer needs to replace a Word invoice + PayPal link.**

---

### Feature 1: Invoice Builder with Line Items and PDF Generation
Creates an invoice with header (client, dates, number), line items (description, quantity, rate, per-line tax), subtotal/tax/total calculation, and renders a PDF.

**Acceptance criteria:**
- User can create an invoice with 1–50 line items
- Each line item stores: description (string), quantity (decimal), rate (decimal), tax_rate_id (nullable FK)
- Total = sum of (quantity × rate) + applied taxes, calculated server-side
- PDF renders in ≤3 seconds from API call, returned as `application/pdf` or a signed URL
- PDF includes: freelancer business name/logo, client billing address, line items table, subtotal, tax breakdown, total, due date, invoice number
- Invoice number auto-increments per user, format configurable (e.g., `INV-0001`)

---

### Feature 2: Client Management
Stores reusable client records that pre-fill invoice header fields.

**Acceptance criteria:**
- Fields: name, email, billing address (street, city, state, postal code, country), company name (optional), currency preference
- Client email must pass RFC 5322 format validation
- Deleting a client with `status != paid AND status != void` invoices returns HTTP 409 with list of blocking invoice IDs
- User can create, read, update, soft-delete clients

---

### Feature 3: Send Invoice via Email with Shareable Link
Delivers a tokenized public URL to the client; tracks open/view events.

**Acceptance criteria:**
- Each invoice gets one `public_token` (UUID v4, non-guessable, stored on Invoice record)
- Public URL pattern: `/invoice/view/{public_token}` — no auth required
- Email sent via transactional provider (Resend or SendGrid); delivery attempt logged to `EmailLog`
- On client page load, invoice `status` transitions `Sent → Viewed` (idempotent — second load does not create duplicate history entry)
- Email send failure returns HTTP 502 to caller with provider error detail; status remains `Draft`/`Sent` as appropriate
- Token does not expire in MVP (expiry is post-MVP)

---

### Feature 4: Payment Recording (Manual + Stripe)
Two paths to mark an invoice paid: freelancer marks manually, or client pays via Stripe Checkout.

**Acceptance criteria:**
- Manual: authenticated user can POST a payment record with `amount`, `paid_at`, `notes`; if `amount >= invoice.total`, status transitions to `Paid`
- Stripe: each invoice has a generated Stripe Payment Link stored on the Invoice record; link created at invoice send time or on demand
- Stripe webhook `checkout.session.completed` creates a `Payment` record and transitions status to `Paid`
- Webhook handler is idempotent: duplicate webhook with same `stripe_session_id` does not create second `Payment` record (upsert by `stripe_session_id`)
- Partial payment (amount < invoice.total) records the payment but does NOT transition status to `Paid` — status remains `Sent`/`Viewed` (partial payment UI is out of scope; the data model supports it)

---

### Feature 5: Invoice Status Lifecycle and Overdue Detection
Enforces `Draft → Sent → Viewed → Paid | Overdue` state machine; detects overdue automatically.

**Acceptance criteria:**
- Valid transitions: `Draft→Sent`, `Sent→Viewed`, `Sent→Overdue`, `Viewed→Overdue`, `Sent→Paid`, `Viewed→Paid`, `Overdue→Paid`. All others return HTTP 422.
- Overdue detection: scheduled job runs every 24 hours; marks invoices `Overdue` where `due_date < NOW()` AND `status IN (Sent, Viewed)`
- On `Overdue` transition, system sends one reminder email to client and logs to `EmailLog`
- Each status transition appends a row to `InvoiceStatusHistory` with `from_status`, `to_status`, `changed_at`, `changed_by` (user ID or `"system"`)
- Dashboard returns: total revenue (sum of paid invoice totals), outstanding balance (sum of sent/viewed invoice totals), overdue count — all scoped to authenticated user

---

### Out of Scope for MVP

| Feature | Reason |
|---|---|
| Recurring invoice scheduling | Cron + idempotency + timezone handling is a separate system; needs post-MVP hardening |
| Multi-currency + exchange rates | Live rate API dependency; adds data model complexity to every monetary field |
| Expense tracking | Different workflow from invoicing; needs its own design |
| Client portal login / saved payment methods | Auth-free token access covers MVP need |
| Tax report export | Requires validated tax logic first; build after tax model is stable |
| Custom templates / branding beyond logo | Single default template sufficient for v1; template engine is scope risk |
| Team / sub-accounts | Changes ownership model on every entity; open question unresolved |

---

## 2. Data Model

**User:** id (UUID PK), email (String, unique), password_hash (String), business_name (String), logo_url (String nullable), default_currency (Enum: USD/EUR/GBP/CAD), stripe_account_id (String nullable), created_at (Timestamp)

**Client:** id (UUID PK), user_id (UUID FK → User), name (String), email (String), company_name (String nullable), billing_address_json (JSONB), currency (Enum), deleted_at (Timestamp nullable)
Relationship: User 1:N Client

**Invoice:** id (UUID PK), user_id (UUID FK → User), client_id (UUID FK → Client), invoice_number (String), status (Enum: Draft/Sent/Viewed/Paid/Overdue), currency (Enum), issue_date (Date), due_date (Date), public_token (UUID, unique index), stripe_payment_link_url (String nullable), notes (Text nullable), created_at (Timestamp), updated_at (Timestamp)
Relationship: User 1:N Invoice, Client 1:N Invoice

**InvoiceLineItem:** id (UUID PK), invoice_id (UUID FK → Invoice), description (String), quantity (Decimal 10,4), rate (Decimal 10,2), tax_rate_id (UUID FK → TaxRate nullable), line_total (Decimal 10,2, computed and stored)
Relationship: Invoice 1:N InvoiceLineItem

**TaxRate:** id (UUID PK), user_id (UUID FK → User), name (String e.g. "GST 10%"), rate_percent (Decimal 5,4), is_default (Boolean)
Relationship: User 1:N TaxRate; TaxRate N:1 InvoiceLineItem (multiple line items can use the same rate)

**Payment:** id (UUID PK), invoice_id (UUID FK → Invoice), amount (Decimal 10,2), currency (Enum), paid_at (Timestamp), method (Enum: Manual/Stripe), stripe_session_id (String nullable, unique index for idempotency), notes (Text nullable)
Relationship: Invoice 1:N Payment

**InvoiceStatusHistory:** id (UUID PK), invoice_id (UUID FK → Invoice), from_status (Enum), to_status (Enum), changed_at (Timestamp), changed_by (String — user UUID or "system")
Relationship: Invoice 1:N InvoiceStatusHistory

**EmailLog:** id (UUID PK), invoice_id (UUID FK → Invoice), recipient_email (String), email_type (Enum: InvoiceSent/OverdueReminder), provider_message_id (String nullable), status (Enum: Queued/Delivered/Failed), sent_at (Timestamp)
Relationship: Invoice 1:N EmailLog

---

## 3. Core User Flows

### Flow A: Create and Send Invoice

1. Authenticated user POST `/clients` (if new) → system returns `client_id`
2. User POST `/invoices` with `client_id`, `issue_date`, `due_date`, `currency`, array of line items → system calculates totals server-side, creates invoice in `Draft` status, returns invoice object
3. User GET `/invoices/{id}/preview` → system renders PDF, returns signed URL (≤3s)
4. User POST `/invoices/{id}/send` → system creates Stripe Payment Link (if not exists), sends email via provider, logs to `EmailLog`, transitions status `Draft→Sent`, returns updated invoice
5. **Error path:** Email provider returns 5xx → system logs `EmailLog.status = Failed`, returns HTTP 502 to caller, status remains `Draft`, no status history entry written for `Sent`

---

### Flow B: Client Views and Pays Invoice

1. Client opens URL `/invoice/view/{public_token}` (no auth) → system looks up invoice by `public_token`
2. If token not found → return HTTP 404 static error page
3. System transitions status `Sent→Viewed` (idempotent: if already `Viewed/Paid/Overdue`, no new history row written)
4. Client clicks "Pay Now" → redirected to `invoice.stripe_payment_link_url`
5. Client completes Stripe Checkout → Stripe fires `checkout.session.completed` webhook
6. Webhook handler: upsert `Payment` by `stripe_session_id` → if new record, transition status to `Paid`, write `InvoiceStatusHistory`, send confirmation email to freelancer
7. **Error path:** Webhook received but invoice already `Paid` (duplicate) → upsert finds existing record, no state change, return HTTP 200 to Stripe

---

### Flow C: Overdue Detection (System Job)

1. Scheduled job runs daily at 00:00 UTC
2. Query: `SELECT * FROM invoices WHERE due_date < CURRENT_DATE AND status IN ('Sent','Viewed')`
3. For each result: transition status to `Overdue`, write `InvoiceStatusHistory` with `changed_by = "system"`
4. Send overdue reminder email to `client.email`, log to `EmailLog`
5. **Error path:** Email send fails for one invoice → log `EmailLog.status = Failed`, continue processing remaining invoices (per-invoice failure isolation)

---

## 4. API Surface

**Auth**
- `POST /auth/register` — create user account
- `POST /auth/login` — return JWT
- `POST /auth/refresh` — refresh access token

**Clients**
- `GET /clients` — list user's clients (paginated)
- `POST /clients` — create client
- `PUT /clients/{id}` — update client
- `DELETE /clients/{id}` — soft-delete; 409 if unpaid invoices exist

**Invoices**
- `GET /invoices` — list with status filter, date range, pagination
- `POST /invoices` — create invoice in Draft
- `GET /invoices/{id}` — fetch invoice with line items and payment summary
- `PUT /invoices/{id}` — update Draft invoice only (non-Draft returns 422)
- `GET /invoices/{id}/preview` — render and return PDF URL
- `POST /invoices/{id}/send` — trigger email, transition to Sent
- `POST /invoices/{id}/payments` — record manual payment
- `DELETE /invoices/{id}` — void invoice (Draft only; Sent+ returns 422)

**Public (no auth)**
- `GET /invoice/view/{public_token}` — render invoice view, trigger Viewed transition

**Webhooks**
- `POST /webhooks/stripe` — handle Stripe events; validate signature

**Dashboard**
- `GET /dashboard/summary` — total paid, outstanding balance, overdue count for authed user

---

## 5. Non-Functional Requirements

**Performance**
- PDF generation: ≤3s p95 (use async queue + polling or webhook callback if Puppeteer; do not block HTTP request thread)
- Dashboard summary endpoint: ≤300ms p95 (pre-aggregate or use indexed queries; do not compute on the fly from raw tables at scale)
- Invoice list endpoint: ≤300ms p95 for up to 500 invoices per user
- Target: 500 concurrent users at launch

**Security**
- Auth: JWT (access token 15min, refresh token 30 days, httpOnly cookie)
- Public invoice tokens: UUID v4 minimum; add rate limiting (20 req/min per IP) on `/invoice/view/` route to prevent enumeration
- Stripe webhook: validate `Stripe-Signature` header on every request; reject without valid signature
- PII in `billing_address_json` and `client.email`: encrypt at rest (AES-256 via DB-level encryption or field-level)
- All endpoints HTTPS only; HSTS enforced

**PDF Generation Architecture Note**
Do not run Puppeteer in-process with the API server. Use a job queue (BullMQ or equivalent). API returns a `job_id`; client polls `GET /invoices/{id}/pdf-status` or receives a webhook/SSE event when ready. Prevents memory exhaustion under concurrent load.

---

## 6. What We're NOT Building

**Partial payments UI:** Data model supports multiple `Payment` records per invoice, but no UI for tracking split payments. Defining "Paid" status with partial amounts requires product decisions on UX and dunning logic. Post-MVP.

**Recurring invoices:** Requires a reliable scheduler with timezone handling, job idempotency, and failure recovery. Scope risk for v1. Build after core invoice flow is stable.

**Multi-currency with live exchange rates:** Adds a third-party rate API dependency and forces every monetary aggregation (dashboard totals) to normalize currencies. Out of scope until currency preference data from real users is available.

**Team/sub-accounts:** Unresolved open question. Adds a `Organization` entity and permission layer that touches every FK in the data model. Cannot be bolted on post-launch without a migration. Requires a separate design decision before any code is written.

**EU VAT / regional tax compliance:** Invoice field requirements vary by jurisdiction (VAT number, reverse charge notation, sequential numbering laws). Implementing incorrectly creates legal liability. Requires legal input before building.

**Client portal accounts:** Clients can view and pay without login (token-based). Saved payment methods, invoice history across tokens, and client self-service require an auth system for external users — separate identity domain from the freelancer auth system.

**Expense tracking:** Different data domain. No shared flow with invoicing in v1. Would dilute MVP focus.