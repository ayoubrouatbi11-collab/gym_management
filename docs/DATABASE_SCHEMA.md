# FitSphere — Database Schema

## 1. Overview

FitSphere uses MySQL 8.0.16 or higher as its relational database management system. MySQL 8.0.16+ is strictly required because earlier versions (and MySQL 5.7) parse but do not enforce `CHECK` constraints.

The database stores and manages:

- User accounts (`users`).
- Trainers (`trainers`).
- Membership plans (`membership_plans`).
- Member subscriptions (`subscriptions`).
- Gym classes (`gym_classes`).
- Class bookings (`bookings`).
- Manual payment records (`payments`).
- Administrative audit logs (`audit_logs`).

The database must maintain data consistency through primary keys, foreign keys, check constraints, indexes, and transactions.

**Database name:** `fitsphere`

**Storage engine:** InnoDB

**Character encoding:** `utf8mb4`

## 2. Database Tables

The database consists of eight relational tables designed with strict referential integrity, automated timestamp tracking, domain check constraints, and historical preservation.

### 2.1 users

Stores administrator and member account information.

| Column | Data type | Constraints | Description |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | User identifier |
| full_name | VARCHAR(100) | NOT NULL | Full name |
| email | VARCHAR(150) | NOT NULL, UNIQUE | Login email (admin-managed identifier) |
| password | VARCHAR(255) | NOT NULL | BCrypt password hash |
| phone | VARCHAR(20) | NULL | Phone number |
| role | ENUM | NOT NULL | `ADMIN` or `MEMBER` |
| account_status | ENUM | NOT NULL, DEFAULT `ACTIVE` | `ACTIVE` or `INACTIVE` |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Check constraints:**
- `CONSTRAINT chk_user_email CHECK (email LIKE '%_@__%.__%')`
- `CONSTRAINT chk_user_name CHECK (CHAR_LENGTH(TRIM(full_name)) >= 2)`

**Important rules:**
- Email addresses must be unique.
- Passwords must always be stored as BCrypt hashes.
- Public registration is not allowed. Only administrators can create member accounts.
- Mandatory password change on first login is not required. Members receive their initial credentials and can log in immediately; they may optionally change their password later via their profile.
- Account status is independent of subscription status.
- An expired subscription must never automatically delete or deactivate a member account.
- Deletion is handled as a **Soft Delete**: deleting a member sets `account_status = 'INACTIVE'`. Physical SQL `DELETE` is prohibited for members who have subscription, booking, or payment history.

### 2.2 trainers

Stores gym trainer information.

| Column | Data type | Constraints | Description |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | Trainer identifier |
| full_name | VARCHAR(100) | NOT NULL | Trainer name |
| specialization | VARCHAR(100) | NOT NULL | Training specialization |
| phone | VARCHAR(20) | NULL | Phone number |
| email | VARCHAR(150) | NULL, UNIQUE | Email address |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Trainer active availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Check constraints:**
- `CONSTRAINT chk_trainer_name CHECK (CHAR_LENGTH(TRIM(full_name)) >= 2)`
- `CONSTRAINT chk_trainer_spec CHECK (CHAR_LENGTH(TRIM(specialization)) >= 2)`

**Important rules:**
- A trainer can be assigned to multiple gym classes.
- Inactive trainers cannot be assigned to new classes.
- Existing class history must be preserved when a trainer becomes inactive.
- Deletion is handled as a **Soft Delete**: deleting a trainer sets `is_active = FALSE`. Physical SQL `DELETE` is disallowed for trainers referenced by existing gym classes.

### 2.3 membership_plans

Stores the membership plans offered by the gym.

| Column | Data type | Constraints | Description |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | Plan identifier |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Plan name |
| duration_months | INT | NOT NULL | Duration in months |
| price | DECIMAL(10,2) | NOT NULL | Plan price |
| description | TEXT | NULL | Plan description |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Plan availability |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Check constraints:**
- `CONSTRAINT chk_plan_duration CHECK (duration_months > 0)`
- `CONSTRAINT chk_plan_price CHECK (price >= 0.00)`

**Important rules:**
- Duration must be greater than zero.
- Price must not be negative.
- Inactive plans cannot be assigned to new subscriptions.
- Existing subscriptions must retain their original plan reference even if the plan later becomes inactive.
- Deletion is handled as a **Soft Delete**: deleting a plan sets `is_active = FALSE`. Physical SQL `DELETE` is disallowed for plans referenced by historical subscriptions.

### 2.4 subscriptions

Stores membership subscriptions.

A member can have multiple subscriptions over time, but each subscription belongs to one member and one membership plan.

| Column | Data type | Constraints | Description |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | Subscription identifier |
| user_id | BIGINT | FK, NOT NULL | Member reference |
| plan_id | BIGINT | FK, NOT NULL | Membership plan reference |
| start_date | DATE | NOT NULL | Subscription start date |
| end_date | DATE | NOT NULL | Subscription expiration date |
| status | ENUM | NOT NULL, DEFAULT `ACTIVE` | `ACTIVE`, `EXPIRED`, `CANCELLED` |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Foreign keys:**
- `user_id` references `users(id)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `plan_id` references `membership_plans(id)` ON DELETE RESTRICT ON UPDATE CASCADE.

**Composite keys & Indexes:**
- `UNIQUE KEY uq_subscription_user (id, user_id)`: Enforces a composite unique identity to support engine-level integrity checks for associated `payments`.

**Check constraints:**
- `CONSTRAINT chk_subscription_dates CHECK (end_date >= start_date)`

**Important rules:**
- Only users with the `MEMBER` role can own subscriptions.
- The end date must not be earlier than the start date.
- A member can have multiple subscription records over time. Previous subscriptions must be preserved as history.
- Renewing a subscription inserts a new record for the existing member; it does not overwrite the previous subscription.
- Subscription expiration does not delete or deactivate the user account.
- **Dynamic Subscription Validity:**
  - There is no cron job, scheduled task, or background worker responsible for automatically updating expired subscriptions.
  - Subscription validity must always be calculated dynamically by the backend using:
    - `status = 'ACTIVE'`
    - Current date between `start_date` and `end_date`, inclusive (`CURRENT_DATE BETWEEN start_date AND end_date`).
  - An `ACTIVE` status in the database does not automatically mean the subscription is currently valid if the calendar date has passed `end_date`.
  - When the end date passes, the database status may remain `ACTIVE`, but the backend dynamically treats it as invalid/expired.
  - `CANCELLED` is used when an administrator manually cancels a subscription.
  - `EXPIRED` may be used as a stored status when explicitly updated, but automatic status updates are not required for subscription validity.
  - All member operations requiring an active subscription (especially class booking) must use this dynamic check.

### 2.5 gym_classes

Stores scheduled gym classes.

| Column | Data type | Constraints | Description |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | Class identifier |
| name | VARCHAR(100) | NOT NULL | Class name |
| description | TEXT | NULL | Class description |
| trainer_id | BIGINT | FK, NOT NULL | Assigned trainer |
| class_date | DATE | NOT NULL | Class date |
| start_time | TIME | NOT NULL | Starting time |
| end_time | TIME | NOT NULL | Ending time |
| capacity | INT | NOT NULL | Maximum participants |
| status | ENUM | NOT NULL, DEFAULT `SCHEDULED` | `SCHEDULED`, `CANCELLED`, `COMPLETED` |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Foreign key:**
- `trainer_id` references `trainers(id)` ON DELETE RESTRICT ON UPDATE CASCADE.

**Check constraints:**
- `CONSTRAINT chk_class_capacity CHECK (capacity > 0)`
- `CONSTRAINT chk_class_time CHECK (end_time > start_time)` (Valid for same-day sessions during gym operating hours, 06:00 to 23:00. Classes do not cross midnight).

**Important rules:**
- Every class must have one assigned trainer.
- Capacity must be greater than zero.
- End time must be later than start time.
- Cancelled and completed classes cannot accept new bookings.
- **Bookable Class Condition:**
  A gym class is bookable only when BOTH conditions are satisfied:
  1. Its status is `SCHEDULED`.
  2. Its starting date and time are still in the future:
     ```sql
     status = 'SCHEDULED'
     AND (
         class_date > CURRENT_DATE
         OR (
             class_date = CURRENT_DATE
             AND start_time > CURRENT_TIME
         )
     )
     ```
  - Members cannot book classes whose start time has already passed.
  - Members cannot book classes scheduled for previous dates.
  - A class with status `CANCELLED` or `COMPLETED` cannot be booked.
  - The administrator does not need to manually mark a past class as `COMPLETED` for booking to become unavailable.
  - This validation must be enforced by the Java backend, not only the React frontend.
- Existing booking history must be preserved when a class is cancelled.

### 2.6 bookings

Stores member bookings for gym classes.

| Column | Data type | Constraints | Description |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | Booking identifier |
| user_id | BIGINT | FK, NOT NULL | Member reference |
| class_id | BIGINT | FK, NOT NULL | Gym class reference |
| booking_date | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Booking creation date |
| status | ENUM | NOT NULL, DEFAULT `BOOKED` | `BOOKED` or `CANCELLED` |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Foreign keys:**
- `user_id` references `users(id)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `class_id` references `gym_classes(id)` ON DELETE RESTRICT ON UPDATE CASCADE.

**Important constraints and rules:**
- Only members can create bookings.
- **Booking History & Duplicates:**
  - There is **no unique constraint on `(user_id, class_id)`** in the database table so that complete booking and cancellation history is preserved.
  - Each booking attempt that is successfully created must have its own database record (`INSERT`).
  - When a member cancels a booking, update the existing record's status to `CANCELLED`. Do not delete it.
  - If the member books the same class again after cancelling, **INSERT a new booking record** instead of reactivating the cancelled one.
  - The backend must prevent multiple active (`BOOKED`) bookings by the same member for the same class:
    ```sql
    SELECT COUNT(*) FROM bookings 
    WHERE user_id = ? AND class_id = ? AND status = 'BOOKED'
    ```
  - Perform the duplicate-active-booking check and insertion safely within a database transaction with pessimistic row-locking on the class record to prevent concurrent duplicate bookings.
  - Cancelled bookings do not count toward class capacity.
  - A member must have a valid active subscription to create a booking.
  - Members can cancel only their own bookings.

### 2.7 payments

Stores manually recorded payments received physically at the gym reception desk.

This table is for administrative tracking, financial auditing, and receipt reconciliation. It does not process online payments.

| Column | Data type | Constraints | Description |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | Payment identifier |
| user_id | BIGINT | FK, NOT NULL | Member reference |
| subscription_id | BIGINT | FK, NOT NULL, UNIQUE | Associated subscription |
| recorded_by_admin_id | BIGINT | FK, NOT NULL | Administrator who verified and recorded payment |
| amount | DECIMAL(10,2) | NOT NULL | Amount received in person |
| payment_method | ENUM | NOT NULL, DEFAULT `CASH` | `CASH` or `CARD` (physical terminal) |
| payment_date | DATE | NOT NULL | Date payment was received |
| receipt_number | VARCHAR(50) | NULL, UNIQUE | Physical paper or POS terminal receipt reference |
| payment_status | ENUM | NOT NULL, DEFAULT `PAID` | `PAID` or `CANCELLED` |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Record last update timestamp |

**Foreign keys & Composite Constraints:**
- `subscription_id` references `subscriptions(id)` ON DELETE RESTRICT ON UPDATE CASCADE (UNIQUE ensures exactly one payment per subscription).
- `recorded_by_admin_id` references `users(id)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `FOREIGN KEY (subscription_id, user_id) REFERENCES subscriptions(id, user_id) ON DELETE RESTRICT ON UPDATE CASCADE`: Engine-level composite foreign key guaranteeing that `payments.user_id` strictly matches the owner of `payments.subscription_id`. Data divergence between payment user and subscription user is physically impossible at the database level.

**Check constraints:**
- `CONSTRAINT chk_payment_amount CHECK (amount >= 0.00)`

**Important rules:**
- Each payment record belongs to one member and one subscription.
- Each subscription has at most one payment record (`UNIQUE` on `subscription_id`).
- `recorded_by_admin_id` is derived **strictly from the authenticated administrator's HTTP session** on the backend. It is never accepted from or trusted from client request parameters.
- `payment_method` reflects physical in-person tender (`CASH` or `CARD` via physical POS terminal). No card credentials or bank numbers are stored.
- `receipt_number` is optional (`NULL` allowed). When provided, it must be unique (`UNIQUE` constraint in MySQL allows multiple `NULL` values).
- Payment records are created exclusively within the initial member creation (`POST /users`) and subscription renewal (`POST /subscriptions`) workflows inside an atomic database transaction. Standalone payment creation is not supported.
- **Payment Cancellation Semantics:**
  - `payment_status = 'PAID'`: Default verified physical tender received.
  - `payment_status = 'CANCELLED'`: Administrative billing void indicator reserved strictly for **clerical data-entry error correction** (e.g. wrong amount entered by staff, voided before accounting settlement). It does **not** trigger an automatic bank refund.
  - **Decoupled from Subscription Cancellation:** Cancelling an active subscription (`PUT /subscriptions/{id}/cancel`) marks the subscription `CANCELLED` to terminate gym access, but the payment record **remains `PAID`**. Membership fees are non-refundable upon cancellation.
- The recorded amount must not be negative.
- Payments are recorded only after the administrator verifies physical receipt of money.
- Payment records must be preserved for administrative history.

### 2.8 audit_logs

Stores immutable audit trail records for sensitive administrative operations, security governance, and compliance.

| Column | Data type | Constraints | Description |
|---|---|---|---|
| id | BIGINT | PK, AUTO_INCREMENT | Audit entry identifier |
| admin_id | BIGINT | FK, NOT NULL | Administrator who performed the action |
| action | VARCHAR(50) | NOT NULL | Action code (e.g. `MEMBER_DEACTIVATED`, `PLAN_DEACTIVATED`) |
| entity_type | VARCHAR(50) | NOT NULL | Target entity type (`USER`, `PLAN`, `TRAINER`, `CLASS`, `SUBSCRIPTION`, `BOOKING`, `PAYMENT`) |
| entity_id | BIGINT | NOT NULL | Identifier of the affected entity record |
| details | TEXT | NULL | Contextual details or state snapshot (credentials excluded) |
| ip_address | VARCHAR(45) | NULL | Client IP address from request |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Event timestamp |

**Foreign key:**
- `admin_id` references `users(id)` ON DELETE RESTRICT ON UPDATE CASCADE.

**Important rules:**
- **Append-Only Technical Enforcement:**
  - Application Code: `AuditLogDAO` provides only `insert` and read query methods. No `update` or `delete` methods exist in the DAO or `AuditService`.
  - Database Permissions: In production, the application database account is granted only `INSERT, SELECT` on `audit_logs` (`REVOKE UPDATE, DELETE, DROP, TRUNCATE ON fitsphere.audit_logs FROM 'fitsphere_app'@'%'`).
- **Credential Hygiene:**
  - `audit_logs.details` must **never** contain plain passwords, password hashes, session IDs, authorization tokens, or financial card data.
  - Sanitization is enforced by `AuditService` before insertion.
- **Atomic Transaction Requirement:**
  - For critical administrative mutations (member registration, subscription renewal, deactivations, cancellations), audit log insertion must occur within the **same database transaction** (`connection.commit()`).
  - If the business mutation rolls back, the audit record is rolled back atomically, preventing phantom audit entries for failed operations.
- **Audited Operations:**
  - `MEMBER_CREATED`: Initial 3-in-1 member registration.
  - `MEMBER_DEACTIVATED` / `MEMBER_ACTIVATED`: Member account status changes.
  - `TRAINER_DEACTIVATED` / `TRAINER_ACTIVATED`: Trainer availability toggles.
  - `PLAN_DEACTIVATED` / `PLAN_ACTIVATED`: Membership plan availability toggles.
  - `CLASS_CANCELLED`: Administrative cancellation of a scheduled class.
  - `SUBSCRIPTION_RENEWED`: Administrative subscription renewal with payment.
  - `SUBSCRIPTION_CANCELLED`: Administrative cancellation of a member subscription.
  - `BOOKING_CANCELLED`: Administrative cancellation of a member booking.
  - `PAYMENT_CANCELLED`: Administrative clerical voiding of a payment entry.

## 3. Table Relationships

| Relationship | Type | Explanation |
|---|---|---|
| users → subscriptions | One-to-many | One member can have multiple subscriptions over time |
| membership_plans → subscriptions | One-to-many | One plan can be used by multiple subscriptions |
| trainers → gym_classes | One-to-many | One trainer can teach multiple classes |
| users → bookings | One-to-many | One member can have multiple bookings (history preserved) |
| gym_classes → bookings | One-to-many | One class can receive multiple bookings |
| users (members) → payments | One-to-many | One member can have multiple payment records |
| subscriptions → payments | One-to-one | Each subscription is associated with at most one payment record |
| users (admin) → payments | One-to-many | One administrator can record and audit multiple physical payments (`recorded_by_admin_id`) |
| users (admin) → audit_logs | One-to-many | One administrator can generate multiple audit log entries (`admin_id`) |

### Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ SUBSCRIPTIONS : "has (member)"
    MEMBERSHIP_PLANS ||--o{ SUBSCRIPTIONS : defines
    TRAINERS ||--o{ GYM_CLASSES : teaches
    USERS ||--o{ BOOKINGS : "makes (member)"
    GYM_CLASSES ||--o{ BOOKINGS : receives
    USERS ||--o{ PAYMENTS : "pays (member)"
    SUBSCRIPTIONS ||--o| PAYMENTS : associated_with
    USERS ||--o{ PAYMENTS : "records (admin)"
    USERS ||--o{ AUDIT_LOGS : "performs (admin)"
```

## 4. Important Database Constraints

1. Every table must have a primary key (`id BIGINT AUTO_INCREMENT`).
2. Emails must be unique in `users` and unique when provided in `trainers`.
3. Membership plan names must be unique.
4. Foreign keys must enforce relational integrity with `ON DELETE RESTRICT ON UPDATE CASCADE`:
   - `subscriptions.user_id` → `users(id)`
   - `subscriptions.plan_id` → `membership_plans(id)`
   - `gym_classes.trainer_id` → `trainers(id)`
   - `bookings.user_id` → `users(id)`
   - `bookings.class_id` → `gym_classes(id)`
   - `payments.subscription_id` → `subscriptions(id)` (UNIQUE)
   - `payments.recorded_by_admin_id` → `users(id)`
   - `payments.(subscription_id, user_id)` → `subscriptions(id, user_id)` (Composite foreign key guaranteeing ownership consistency)
   - `audit_logs.admin_id` → `users(id)`
5. Domain check constraints (Enforced in MySQL 8.0.16+):
   - `users`: Email format pattern and minimum name length. *Architectural note: Authoritative RFC-compliant email validation is executed by `UserValidator` in the Java application layer; the database `CHECK` acts as a secondary structural backstop.*
   - `trainers`: Minimum full name and specialization length.
   - `membership_plans`: `duration_months > 0`, `price >= 0.00`. *(Decision flagged for approval: Allows complimentary trial passes at 0.00; if gym policy requires all plans to be strictly paid products, update to `price > 0.00`).*
   - `subscriptions`: `end_date >= start_date`.
   - `gym_classes`: `capacity > 0`, `end_time > start_time`. *(Valid for same-day gym sessions during facility hours 06:00 to 23:00; sessions do not cross midnight).*
   - `payments`: `amount >= 0.00`. *(Decision flagged for approval: Allows 0.00 payments for complimentary plans; if all transactions require monetary funds, update to `amount > 0.00`).*
6. The backend enforces that a member cannot have more than one active (`BOOKED`) booking for the same class at the same time.
7. Payment receipts are unique when provided (`payments.receipt_number UNIQUE`).

## 5. Indexing Recommendations

The following columns should be indexed for query performance:

- `users.email` (provided by UNIQUE)
- `users.role`
- `users.account_status`
- `subscriptions.user_id`
- `subscriptions.plan_id`
- `subscriptions.status`
- `subscriptions.(status, start_date, end_date)` (composite index for dynamic subscription validity checks)
- `gym_classes.trainer_id`
- `gym_classes.class_date`
- `gym_classes.(status, class_date, start_time)` (composite index for bookable class schedule queries)
- `bookings.user_id`
- `bookings.class_id`
- `bookings.status`
- `bookings.(class_id, status)` (composite index for real-time class capacity checks)
- `bookings.(user_id, class_id, status)` (composite index for duplicate active booking checks)
- `payments.user_id`
- `payments.subscription_id` (provided by UNIQUE)
- `payments.recorded_by_admin_id`
- `payments.payment_date`
- `audit_logs.admin_id`
- `audit_logs.created_at`
- `audit_logs.(entity_type, entity_id)`

## 6. Data Integrity and Deletion Policy (Soft Delete)

FitSphere adopts a **Soft Delete** strategy for historical integrity:

- **Members:** Deleting a member updates `account_status = 'INACTIVE'`. Physical `DELETE` is prohibited for members who have subscription, booking, or payment history.
- **Trainers:** Deleting a trainer updates `is_active = FALSE`. Inactive trainers remain referenced by past classes.
- **Membership Plans:** Deleting a plan updates `is_active = FALSE`. Inactive plans remain referenced by historical subscriptions.
- **Subscriptions:** Never deleted when expired. Preserved for billing and membership records.
- **Bookings:** Cancelling a booking updates `status = 'CANCELLED'`. Never physically deleted, providing an audit trail of bookings and cancellations.
- **Audit Logs:** Append-only and immutable. No records are ever modified or deleted.
- **Foreign Keys:** Use `ON DELETE RESTRICT` on historical tables to prevent accidental cascading data loss.

## 7. Transaction Requirements

Multi-step operations must be executed inside database transactions (`connection.setAutoCommit(false)`):

### 7.1 Creating a New Member (3-in-1 Workflow)
The administrator workflow creates three related records atomically in a single transaction:
1. Validate that all required member, plan, and payment fields are provided (initial subscription and payment are **mandatory**). Verify password policy (minimum 12 characters, maximum 72 UTF-8 bytes, spaces and all character types allowed, no forced composition rules).
2. `INSERT INTO users (...)` (create member account)
3. Compute `end_date` using inclusive calendar range: `startDate.plusMonths(durationMonths).minusDays(1)`.
4. `INSERT INTO subscriptions (...)` (create initial subscription)
5. `INSERT INTO payments (...)` (record manual verified payment, setting `recorded_by_admin_id` from current admin session, `payment_method`, optional `receipt_number`)
6. `INSERT INTO audit_logs (...)` (record member creation audit event)
7. `connection.commit()`

If any step fails, `connection.rollback()` reverts all changes.

### 7.2 Renewing a Subscription
1. Verify member and payment physically.
2. Compute `end_date` using inclusive calendar range: `startDate.plusMonths(durationMonths).minusDays(1)`.
3. `INSERT INTO subscriptions (...)` (new subscription record for existing member)
4. `INSERT INTO payments (...)` (payment record for new subscription, with `recorded_by_admin_id` from current admin session)
5. `INSERT INTO audit_logs (...)` (record subscription renewal audit event)
6. `connection.commit()`

### 7.3 Booking a Class (Strict Concurrency & Row-Locking Sequence)
To prevent simultaneous requests from exceeding capacity or creating duplicate active bookings, the backend executes this exact sequence:
1. **Begin Transaction:** `connection.setAutoCommit(false)`.
2. **Lock Class Row First:**
   ```sql
   SELECT id, capacity, status, class_date, start_time 
   FROM gym_classes 
   WHERE id = ? 
   FOR UPDATE
   ```
   *Acquiring this exclusive row lock first serializes all concurrent booking attempts for this class.*
3. **Check Subscription Validity:**
   ```sql
   SELECT id FROM subscriptions 
   WHERE user_id = ? AND status = 'ACTIVE' AND CURRENT_DATE BETWEEN start_date AND end_date
   ```
4. **Check Class Bookability:** Verify locked class has `status = 'SCHEDULED'` and `(class_date > CURRENT_DATE OR (class_date = CURRENT_DATE AND start_time > CURRENT_TIME))`.
5. **Check Existing Active Booking:**
   ```sql
   SELECT COUNT(*) FROM bookings 
   WHERE user_id = ? AND class_id = ? AND status = 'BOOKED'
   ```
   If count > 0, rollback (duplicate booking).
6. **Check Available Capacity:**
   ```sql
   SELECT COUNT(*) FROM bookings 
   WHERE class_id = ? AND status = 'BOOKED'
   ```
   If `activeBookingsCount >= capacity`, rollback (class full).
7. **Insert New Booking:**
   ```sql
   INSERT INTO bookings (user_id, class_id, status) VALUES (?, ?, 'BOOKED')
   ```
8. **Commit Transaction:** `connection.commit()`.

## 8. Database Configuration

- Connection via JDBC using required environment variables: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.
- Read configuration using `System.getenv(...)`. Variables may be configured via workstation environment variables or Apache Tomcat's `bin/setenv.bat` (Windows) / `bin/setenv.sh` (Linux).
- If any required environment variable is missing or blank, `DatabaseConfig` must immediately throw a descriptive `IllegalStateException` (e.g., `"Missing required database environment variable: DB_PASSWORD"`).
- Never use hardcoded database credentials or default passwords. No hardcoded credentials in source code or committed files.
