# PRD: freelance-invoice-saas

---

## 1. MVP Scope

**Five features constitute a working v1:**

---

**1. Invoice Creation with Line Items, Tax, and Discount**
Creates a payable invoice document with all fields required for legal and accounting validity.

- POST /invoices returns a persisted invoice with status `draft`
- Invoice contains: at minimum 1 line item (description, qty, unit_price), one tax_rate (can be 0%), one discount (flat or percent, can be 0)
- Subtotal, tax amount, discount amount, and total are calculated server-side, not client-side
- Invoice total stored in minor currency units (cents) to avoid float errors
- Draft invoice is editable; once status transitions to `sent`, line items become immutable
- Invoice number auto-increments per user namespace (INV-0001, INV-0002...)

---

**2. Client Management**
Stores billing targets; required before an invoice can be created.

- Client requires: name (string), email (valid format), billing_address (string, freetext acceptable for MVP)
- Client is soft-deleted only — no hard delete if invoices exist (see Flow 5)
- A user can create a client inline during invoice creation without leaving the invoice form
- GET /clients returns only clients owned by the authenticated user

---

**3. PDF Generation and Email Delivery**
Converts invoice data to a portable document and delivers it to the client.

- PDF generation completes in under 3 seconds for invoices with ≤50 line items
- PDF is generated asynchronously via job queue; invoice status transitions to `sent` only after confirmed queue completion
- Email is sent via SendGrid or Postmark; delivery attempt is logged in EmailLog with provider message ID
- Email contains a signed URL (HMAC-signed, no auth required to open) pointing to the invoice public view
- Signed URL token is scoped to invoice_id and expires never for MVP (revocable in post-MVP)

---

**4. Payment Status Tracking with Manual Mark-as-Paid**
Gives the freelancer accurate receivables state without requiring payment processor integration.

- Invoice status enum: `draft` → `sent` → `viewed` → `paid` | `overdue`
- Status `viewed` is set server-side when the signed URL is opened (GET /invoices/:token/view)
- Status `overdue` is set by a scheduled job that runs daily, transitions any `sent` or `viewed` invoice past its due_date
- Manual mark-as-paid: PATCH /invoices/:id/mark-paid creates a Payment record and locks the invoice
- Once `paid`, invoice fields are immutable; any PATCH to line items or amounts returns 409
- Due date is required at invoice creation

---

**5. Basic Dashboard**
Gives the freelancer a real-time snapshot of cash position.

- Dashboard endpoint returns: total_outstanding (sum of unpaid sent/overdue invoices), total_paid_current_month, count of overdue invoices
- All aggregates computed in the user's default currency; multi-currency deferred to post-MVP
- Dashboard query must respond under 300ms p95
- No chart rendering in MVP — raw numbers only, frontend renders

---

**OUT OF SCOPE for MVP:**

| Feature | Reason |
|---|---|
| Stripe/PayPal payment collection | Webhook idempotency + Stripe Connect architecture decisions unresolved (see Open Questions) |
| Automated reminder emails | Requires scheduler + ReminderSchedule config UI; adds infra without proving core value |
| Recurring invoice templates | Adds state machine complexity; not needed to validate core loop |
| Multi-currency | Normalization strategy unresolved; reporting ambiguity is a data integrity risk |
| Expense and time tracking | Separate product surface; distracts from invoicing core |
| Client self-service portal (pay online) | Blocked on payment processor decision |
| Custom invoice branding | Nice-to-have; HTML/CSS template system adds scope |
| Team/multi-user accounts | Auth complexity; single-user validates market first |
| Tax report export | No data volume to report on yet |

---

## 2. Data Model

**User:** id (UUID), email (String, unique), password_hash (String), business_name (String), default_currency (String ISO-4217, default "USD"), created_at (Timestamp)

**Plan:** id (UUID), name (Enum: free|pro|business), invoice_monthly_limit (Int), client_limit (Int)

**Subscription:** id (UUID), user_id → User (1:1), plan_id → Plan (N:1), status (Enum: active|cancelled|past_due), current_period_end (Timestamp)

**Client:** id (UUID), user_id → User (N:1), name (String), email (String), billing_address (String), is_archived (Boolean, default false), created_at (Timestamp)

**TaxRate:** id (UUID), user_id → User (N:1), label (String), rate_percent (Decimal 5,4), is_default (Boolean)

**Invoice:** id (UUID), user_id → User (N:1), client_id → Client (N:1), invoice_number (String), status (Enum: draft|sent|viewed|paid|overdue), currency (String ISO-4217), discount_type (Enum: flat|percent), discount_value (Int, minor units or basis points), tax_rate_id → TaxRate (N:1), due_date (Date), issued_date (Date), notes (Text, nullable), pdf_url (String, nullable), signed_token (String, unique), created_at (Timestamp)

**InvoiceLineItem:** id (UUID), invoice_id → Invoice (N:1), description (String), quantity (Decimal 10,2), unit_price (Int, minor units), tax_rate_id → TaxRate (N:1, nullable, overrides invoice-level tax)

**Payment:** id (UUID), invoice_id → Invoice (1:N), amount (Int, minor units), currency (String), method (Enum: manual|stripe|paypal), recorded_at (Timestamp), recorded_by_user_id → User

**InvoiceStatusHistory:** id (UUID), invoice_id → Invoice (N:1), from_status (Enum), to_status (Enum), changed_at (Timestamp), changed_by (Enum: user|system)

**EmailLog:** id (UUID), invoice_id → Invoice (N:1), recipient_email (String), provider_message_id (String), status (Enum: queued|delivered|bounced|failed), sent_at (Timestamp)

**Relationships summary:** User 1:1 Subscription, Subscription N:1 Plan, User 1:N Client, User 1:N Invoice, Client 1:N Invoice, Invoice 1:N InvoiceLineItem, Invoice N:1 TaxRate, InvoiceLineItem N:1 TaxRate, Invoice 1:N Payment, Invoice 1:N InvoiceStatusHistory, Invoice 1:N EmailLog

---

## 3. Core User Flows

**Flow 1: Create and Send Invoice**
1. User authenticates → GET /dashboard loads
2. User clicks "New Invoice" → GET /clients returns client list
3. User selects client OR submits POST /clients inline → client_id returned
4. User adds line items, sets due_date, applies tax_rate_id, sets discount
5. User clicks "Preview" → GET /invoices/:id/preview returns rendered HTML
6. User clicks "Send" → POST /invoices/:id/send
7. System enqueues PDF generation job → on completion, sets pdf_url and enqueues email job
8. Email job sends via provider → logs to EmailLog → sets invoice status to `sent`
9. If PDF generation fails after 3 retries → status remains `draft`, user receives in-app error, email is NOT sent
10. If email delivery bounces → EmailLog.status = `bounced`, invoice stays `sent`, user notified via dashboard flag

**Flow 2: Client Views and Invoice is Tracked**
1. Client receives email, clicks signed URL
2. GET /invoices/:token/view → server validates HMAC token → returns invoice data
3. If token invalid or malformed → 404 (do not reveal invoice existence)
4. Server sets invoice status `viewed` if current status is `sent` (idempotent — no re-trigger if already `viewed`)
5. InvoiceStatusHistory record created

**Flow 3: Mark Invoice as Paid**
1. User clicks "Mark as Paid" on invoice → PATCH /invoices/:id/mark-paid
2. System creates Payment record, transitions status to `paid`, creates InvoiceStatusHistory entry
3. Invoice fields become immutable — subsequent PATCH to invoice or line items returns 409 with error: "Invoice is paid. Create a credit note to adjust."
4. If invoice is already `paid` → PATCH returns 409 (idempotent guard)

**Flow 4: Client Soft-Delete Guard**
1. User attempts DELETE /clients/:id
2. System checks for invoices with client_id matching, status NOT in (paid) — i.e., active invoices exist
3. If active invoices exist → 409 returned with list of invoice_ids and statuses
4. User must either reassign invoices (PATCH /invoices/:id with new client_id) or accept archival
5. DELETE /clients/:id?force_archive=true → sets client.is_archived = true, invoices retain client_id reference

---

## 4. API Surface

**Auth**
- POST /auth/register — create user account
- POST /auth/login — return JWT
- POST /auth/logout — invalidate token
- GET /auth/me — return current user profile

**Clients**
- GET /clients — list user's clients (exclude archived unless ?include_archived=true)
- POST /clients — create client
- PATCH /clients/:id — update client fields
- DELETE /clients/:id — soft-delete with guard (see Flow 4)

**Invoices**
- GET /invoices — list with filter params: status, client_id, date_range
- POST /invoices — create invoice in draft
- GET /invoices/:id — get single invoice with line items
- PATCH /invoices/:id — update draft invoice (returns 409 if paid)
- POST /invoices/:id/send — trigger PDF + email pipeline
- PATCH /invoices/:id/mark-paid — manual payment recording
- GET /invoices/:token/view — public signed URL view (no auth)

**Tax Rates**
- GET /tax-rates — list user's tax rates
- POST /tax-rates — create tax rate
- DELETE /tax-rates/:id — delete if not referenced by unpaid invoices

**Dashboard**
- GET /dashboard/summary — returns outstanding total, paid this month, overdue count

---

## 5. Non-Functional Requirements

**Performance**
- Dashboard and invoice list endpoints: p95 latency ≤300ms under 500 concurrent users
- PDF generation: ≤3 seconds for invoices with ≤50 line items; executed async via BullMQ + Redis, never in request thread
- Invoice list pagination required at page size 50; no unbounded queries

**Security**
- Auth: JWT with 15-minute access token + rotating refresh token (httpOnly cookie)
- Public invoice URLs: HMAC-SHA256 signed tokens; token includes invoice_id + secret; validated server-side on every request
- Free plan limits (5 clients, 10 invoices/month) enforced server-side in middleware, not client-side
- Invoice amount calculations performed server-side only — client sends qty and unit_price, server computes totals
- All invoice financial fields encrypted at rest if PII regulation applies to deployment region

**Reliability**
- Email jobs: at-least-once delivery with deduplication via EmailLog.provider_message_id; duplicate sends blocked by checking existing successful EmailLog for same invoice
- Overdue status job: idempotent — re-running on same day produces no duplicate status history entries
- PDF job: max 3 retries with exponential backoff; failure state surfaced to user

---

## 6. What We're NOT Building

| Feature | Why Not |
|---|---|
| Stripe/PayPal online payment collection | Requires decision on direct account vs. Stripe Connect (platform fees, compliance). Connect adds KYC/AML obligations. Ship after architecture decision is made. |
| Automated reminder emails | Requires ReminderSchedule config, per-invoice opt-out, and a reliable cron system. Manual workflow sufficient to validate product. |
| Custom invoice branding (logo, colors) | Requires template engine with user asset storage (S3). MVP uses a fixed template. |
| Multi-currency support | Storing and reporting across currencies requires upfront normalization decision. Single-currency eliminates entire class of reporting bugs at MVP. |
| Client self-service payment portal | Blocked on payment processor decision. Public view endpoint is built; payment action is not. |
| Time tracking | Separate UX surface, different user behavior. Needs independent research. |
| Expense tracking | Same as above. Out of invoicing core loop. |
| Team accounts / accountant access | Multi-tenancy with role-based access adds auth complexity. Single user per account for v1. |
| Tax report export | No historical data to export at launch. Build after users accumulate 6+ months of invoices. |
| Recurring invoice templates | Adds a scheduler, approval workflow, and auto-send config. Deferred until core send loop is validated. |
| Multi-language invoice templates | Requires i18n data layer on the invoice rendering model. No evidence of demand until user research post-launch. |