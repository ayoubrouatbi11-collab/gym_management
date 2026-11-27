# FitSphere — Implementation Task Roadmap

## 1. Overview and Purpose

This document translates the approved FitSphere system requirements, database schema, architecture, and API contracts into an actionable, phased development roadmap for the 3-developer team.

Every task specifies:
- Unique identifier (e.g., `INIT-01`, `DB-01`, `DAO-01`, `AUTH-01`, `VIS-01`, `ADM-01`, `MEM-01`, `INT-01`, `TEST-01`, `REL-01`).
- Descriptive title and architectural summary.
- Responsible owner (**Developer 1**, **Developer 2**, **Developer 3**, or **Shared**).
- Prerequisites and task dependencies.
- Clear, verifiable completion criteria.
- Current status (`Not Started`, `In Progress`, or `Completed`).

---

## 2. Team Role Assignments & Ownership

The team operates on a **Role-Based Full-Stack Ownership** model:

| Role | Team Member | Scope of Ownership |
|---|---|---|
| **Visitor / Public** | **Developer 1** | Public homepage, navigation, gym services, trainer listing, pricing plans, public class schedule, login UI, and corresponding public backend endpoints and DAOs. |
| **Administrator** | **Developer 2** | Admin dashboard, unified member creation (3-in-1), member CRUD, trainer CRUD, plan CRUD, subscription renewal, payment audit tracking, class management, administrative booking oversight, admin-only backend servlets, and administrative DAOs. |
| **Member & Database** | **Developer 3** | **Dual Responsibility:**<br>1. **Exclusive Database Owner:** MySQL database creation, `database/schema.sql`, `seed.sql`, 8 tables, constraints, composite keys, indexes, and connection verification.<br>2. **Member Features:** Member dashboard, profile editing, password change, subscription history, transactional class booking engine with pessimistic row locking (`SELECT ... FOR UPDATE`), personal booking history, cancellation, and member DAOs. |
| **Shared Core** | **Shared (All 3)** | Database connectivity setup, shared entity models, DTOs, BaseServlet, authentication/session management (`AuthServlet`, `AuthFilter`), API contract coordination, and integration/security testing. |

### 2.1 Database Ownership and Coordination Rules
- **Developer 3 is the exclusive owner of database creation and setup.**
- The database schema strictly adheres to [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/DATABASE_SCHEMA.md) and contains **8 relational tables**:
  `users`, `trainers`, `membership_plans`, `subscriptions`, `gym_classes`, `bookings`, `payments`, `audit_logs`.
- Developers 1 and 2 must communicate any query or data requirements to Developer 3 and must **never** independently alter database tables, column structures, or constraints.
- Schema creation (`DB-01`, `DB-02`, `DB-03`) is a critical prerequisite for all database-backed backend DAOs and services.

### 2.2 Shared Backend Implementation Leads & Coordination Rules
To prevent ambiguity, merge collisions, or implementation deadlock while maintaining shared architectural standards, the team has designated specific **primary implementation leads** for foundational backend tasks:
- **Developer 3 (Lead):** Implements `DB-04` (`DatabaseConfig.java` / `DatabaseConnection.java`), `BASE-01` (POJO entity models & enums), `BASE-02` (`JsonUtil.java` & `DateUtil.java`), `BASE-03` (DTOs), and `DAO-04` (`GymClassDAO.java`, `BookingDAO.java`). Developer 3 remains the **exclusive database owner** (`DB-01` through `DB-03`).
- **Developer 2 (Lead):** Implements `BASE-04` (Validators & `AppException` hierarchy), `BASE-05` (`BaseServlet.java`), `DAO-01` (`UserDAO.java`, `AuditLogDAO.java`), `DAO-03` (`SubscriptionDAO.java`, `PaymentDAO.java`), and `AUTH-03` (`AuthFilter.java` and `CorsFilter.java`), establishing server-side role validation, CSRF checks, CORS preflight handling, and security filters for admin-protected and member routes.
- **Developer 1 (Lead):** Implements `AUTH-01` (`PasswordUtil.java` — sole owner of password hashing, verification, and policy enforcement), `AUTH-02` (`AuthServlet.java`), and `DAO-02` (`TrainerDAO.java`, `MembershipPlanDAO.java`), driving session login, logout, rate limiting, and session identity endpoints aligned with the visitor login UI.

### 2.3 Peer Review & Approval Requirements for Shared Code
- These assignments designate **primary implementation leads**, not permission to change shared architecture or database models independently.
- **Mandatory Peer Review for Shared Code:** Any Pull Request introducing or modifying shared foundation code (`BASE-01` through `BASE-05`, `DAO-01` through `DAO-04`, `AUTH-01` through `AUTH-03`, `DB-04`) requires mandatory review and approval from at least one other affected developer before merging into `development`.
- Shared authentication/session behavior, session attribute keys (`userId`, `role`), JSON response formats, and integration points must be strictly coordinated between the relevant developers.
- All implementations must strictly conform to [`docs/API_CONTRACT.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/API_CONTRACT.md), [`docs/ARCHITECTURE.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/ARCHITECTURE.md), and [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/DATABASE_SCHEMA.md).

---

## 3. Git Collaboration & Team Workflow Rules

The repository follows a clean, structured 3-tier Git branching model designed for three concurrent developers working within a monorepo.

```text
main           ─────────────────────────────────────────● (v1.0 Milestone Release)
                                                        ▲
                                                        │ PR / Merge (Milestone)
development    ────●───────────●───────────────●────────●
                    \         /               / \      /
      feature branches\       / feature/admin-crud \  / feature/member-booking
                       ●─────●                      ●●
```

### 3.1 Branching Strategy
1. **`main` (Production / Stable Release):**
   - Contains only stable, integrated, and thoroughly tested code.
   - **Direct commits or direct pushes to `main` are strictly forbidden.**
   - Updated exclusively via Pull Request from `development` when milestones are completed and verified.
2. **`development` (Shared Integration Branch):**
   - The primary integration branch where all feature branches merge.
   - All feature branches branch off `development` and merge back into `development`.
   - Must always remain in a clean, compiling, and runnable state.
3. **`feature/*` Branches (Individual Task Workstreams):**
   - Created by individual developers for specific tasks (e.g. `feature/visitor-plans`, `feature/admin-member-crud`, `feature/member-booking`).
   - Short-lived and scoped to one roadmap task or cohesive feature slice.

### 3.2 Commit Message Conventions
Commits must follow the **Conventional Commits** standard:
```text
<type>(<scope>): <short imperative description>
```
- **Allowed Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- **Approved Scopes:** `visitor`, `admin`, `member`, `auth`, `database`, `dao`, `service`, `api`, `deps`.
- **Examples:**
  - `feat(admin): implement unified 3-in-1 member creation in UserService`
  - `fix(booking): acquire class row lock before checking capacity in BookingDAO`
  - `feat(auth): regenerate session id upon login to prevent session fixation`
  - `test(booking): add concurrency stress test for class capacity overflow`

### 3.3 Pull Request & Code Review Process
1. **Target Branch:** All feature PRs must target `development`. Never target `main`.
2. **Mandatory Peer Review for Shared Modules:**
   - Any PR touching `database/`, shared models (`BASE-01`), DTOs (`BASE-03`), utilities (`BASE-02`), `BaseServlet` (`BASE-05`), or authentication filters (`AUTH-03`) requires **at least one approving review** from another team member before merging.
3. **Pre-Merge Verification Checklist:**
   - [ ] Frontend compiles with 0 errors (`cd frontend && npm run build`).
   - [ ] Backend Maven project builds cleanly (`mvn clean compile`).
   - [ ] No hardcoded passwords, database secrets, or committed `.env` files.
   - [ ] Endpoints and payloads strictly match `docs/API_CONTRACT.md`.
4. **Merge Strategy:** Squash and merge or rebase merge to keep `development` history linear and readable. Delete the feature branch immediately after merge.

### 3.4 Database Schema Change Governance
- **Only Developer 3 is authorized to modify `database/schema.sql` or `database/seed.sql`.**
- If Developer 1 or Developer 2 identifies a new data requirement or query index need:
  1. The developer opens an issue or discussion proposing the change with technical justification.
  2. The proposed change is reviewed against `docs/DATABASE_SCHEMA.md` and approved by all three developers.
  3. Developer 3 executes the schema modification, updates `docs/DATABASE_SCHEMA.md`, and notifies the team.

### 3.5 Conflict Resolution Protocol
- If a merge conflict occurs when updating from `development`:
  1. Fetch latest changes: `git fetch origin`.
  2. Rebase or merge `development` into the local feature branch: `git merge origin/development`.
  3. Resolve conflicts in the working tree.
  4. Never overwrite a teammate's logic without consulting them.
  5. Run tests and verify both frontend and backend compile before pushing.

---

## 4. Backend Architectural Flow (Servlet → Service → DAO → MySQL)

All backend request processing strictly adheres to the 5-tier enterprise architecture:

```text
[HTTP Request]
      │
      ▼
[Filter Layer] (CorsFilter, AuthFilter: Session & Role Verification, CSRF Check)
      │
      ▼
[Servlet Layer] (BaseServlet + Domain Servlets: Path routing, JSON Deserialization, HTTP Status)
      │
      ▼
[Service Layer] (Business Rules, Transaction Boundaries, Pessimistic Locking, Dynamic Validity)
      │
      ▼
[DAO Layer] (Pure JDBC, PreparedStatement, Parameterized SQL, ResultSet Mapping)
      │
      ▼
[MySQL Database] (8 InnoDB Tables, Foreign Keys, Check Constraints, Composite Constraints)
```

1. **Servlets:** Handle HTTP transport, extract session identity, deserialize request DTOs via `JsonUtil`, delegate to services, catch typed `AppException`, and return response DTOs.
2. **Services:** Enforce business invariants (dynamic subscription validity, bookability of future classes, soft-delete restrictions), coordinate transactions across multiple DAOs (`connection.setAutoCommit(false)`), manage pessimistic row locks, and write audit logs.
3. **DAOs:** Execute parameterized SQL queries via `PreparedStatement`. Accept optional transactional `Connection` instances from services. Map `ResultSet` rows to `model` POJOs. Omit generic `BaseDAO` in favor of type-safe, explicit JDBC methods.
4. **Models:** Pure Java POJOs and type-safe enums representing database tables and domain entities.
5. **DTOs:** Request and response envelopes cleanly separating external API contracts from internal database representations.

---

## 5. Dependency Graph & Parallel Workstreams

```text
[Phase 1: Project Initialization] (INIT-01 to 04) - COMPLETED
          │
          ▼
[Phase 2: Database & Shared Backend Foundation]
 ├── Developer 3: Database Setup (DB-01, 02, 03) ───────────────────┐
 ├── Developer 3: Connection & Models (DB-04, BASE-01, 02, 03) ◄───┤
 ├── Developer 2: Validators & BaseServlet (BASE-04, BASE-05) ◄─────┤
 └── Explicit DAO Layer Setup (DAO-01, 02, 03, 04) ◄────────────────┘
          │
          ▼
[Phase 3: Authentication & Security Foundation] (AUTH-01, 02, 03, 04, 05)
          │
          ├─────────────────────────┬─────────────────────────┐
          ▼                         ▼                         ▼
   [Phase 4: Visitor]        [Phase 5: Admin]          [Phase 6: Member]
     (Developer 1)             (Developer 2)             (Developer 3)
   • Public UI & Layout      • Admin Dashboard         • Member Dashboard
   • Public Servlets         • 3-in-1 Member Creation  • 8-Step Class Booking
   • Public DAOs             • Subscription Renewal    • Dynamic Validity
   • Login UI & Auth Hook    • Audit & Oversight       • History & Cancel
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
                     [Phase 7: System Integration] (INT-01 to 04)
                                    │
                                    ▼
                     [Phase 8: Security & Testing] (TEST-01 to 13)
                                    │
                                    ▼
                     [Phase 9: Final Capstone Release] (REL-01 to 03)
```

### Parallel Development & Frontend Mocking Strategy
- **Frontend Mock-Data vs. Live Backend Hookup:** Frontend UI tasks (e.g. `VIS-04`, `VIS-06`, `VIS-08`, `ADM-03`, `ADM-05`, `MEM-06`) can proceed immediately with component markup, CSS styling, and local state management using mock data in their feature branches. The documented backend servlet dependencies apply specifically to the **live API integration and verification** step.
- While Developer 3 implements the database schema (`DB-01`–`DB-03`), Developers 1 and 2 can build frontend page layouts and static UI components without waiting for live SQL endpoints.
- Once Phase 3 (Authentication) is complete, **Phases 4, 5, and 6 can be developed simultaneously** by the three developers in their respective feature branches without blocking each other.

---

## 6. Detailed Phased Task List

### Phase 1 — Project Initialization

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `INIT-01` | Monorepo Structure & Git Configuration | Shared | None | Root repository initialized with `README.md`, `.gitignore`, `.env.example`, and baseline documentation structure. | **Completed** |
| `INIT-02` | React + Vite Frontend Initialization | Developer 1 & Shared | `INIT-01` | React app with React Router v6, folder structure, and service stubs compiles cleanly via `npm run build` on port 3000. | **Completed** |
| `INIT-03` | Java 17 + Tomcat 10.1 Maven Setup | Shared | `INIT-01` | `pom.xml` configured with Jakarta Servlet 6.0, MySQL Connector/J, Gson, jBCrypt; `web.xml` configured for sessions. | **Completed** |
| `INIT-04` | Local Developer Environment Verification | Shared | `INIT-02`, `INIT-03` | Each developer verifies local Java 17 JDK, Node.js, and local `.env` configuration. | **Completed** |

---

### Phase 2 — Database Creation & Shared Backend Foundation

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `DB-01` | MySQL Database & Table Schema Definition | **Developer 3** | `INIT-04` | `database/schema.sql` written with all **8 tables** (`users`, `trainers`, `membership_plans`, `subscriptions`, `gym_classes`, `bookings`, `payments`, `audit_logs`) using InnoDB and `utf8mb4`. | Not Started |
| `DB-02` | Table Constraints, Foreign Keys & Indexes | **Developer 3** | `DB-01` | Primary keys, foreign keys (`RESTRICT` policies), unique indexes (`users.email`, `plans.name`, `payments.subscription_id`, `payments.receipt_number`), composite unique key `subscriptions(id, user_id)`, composite foreign key `payments(subscription_id, user_id) REFERENCES subscriptions(id, user_id)`, domain check constraints (MySQL 8.0.16+), and performance indexes implemented in `schema.sql`. | Not Started |
| `DB-03` | Demo Seed Data Script Implementation | **Developer 3** | `DB-02` | `database/seed.sql` prepared with sample admin, members, trainers, plans, classes, initial payments, and BCrypt password hashes. | Not Started |
| `DB-04` | Database Connection Lifecycle & Config | **Developer 3 (Lead)** | `DB-02` | `DatabaseConfig.java` implemented to load credentials from OS/Tomcat environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, via `System.getenv(...)`, not auto-read from root `.env`), throwing `IllegalStateException` on missing variables. `DatabaseConnection.java` provides thread-safe JDBC connection acquisition with dual-mode support (Tomcat JNDI pool vs. standalone `DriverManager`), strictly releasing resources via `try-with-resources`. Documents Tomcat session cookie configuration: `HttpOnly=true` configured in `WEB-INF/web.xml` (`<cookie-config>`), `SameSite=Lax` configured via Tomcat's `CookieProcessor` in `META-INF/context.xml`, and `Secure` flag configured through environment-specific deployment/Tomcat configuration (`Secure=false` in local HTTP development, `Secure=true` in production HTTPS, rather than a dynamically conditional value in a static `web.xml`). | Not Started |
| `BASE-01`| Shared Java Entity Models (POJOs) & Enums | **Developer 3 (Lead)** | `DB-02` | Models created in `com.fitsphere.model` for all 8 entities (`User`, `Trainer`, `MembershipPlan`, `Subscription`, `GymClass`, `Booking`, `Payment`, `AuditLog`) and type-safe enums in `com.fitsphere.model.enums` (`Role`, `AccountStatus`, `SubscriptionStatus`, `ClassStatus`, `BookingStatus`, `PaymentStatus`, `PaymentMethod`, `AuditAction`, `EntityType`). | Not Started |
| `BASE-02`| JSON Serialization & Base Utility Setup | **Developer 3 (Lead)** | `INIT-03` | `JsonUtil.java` configured with Gson using explicit `TypeAdapter`s for `java.time.LocalDate`, `LocalTime`, and `LocalDateTime` (preventing Java 17+/25 reflection errors) and standardized response envelopes; `DateUtil.java` configured for calendar math (`plusMonths(duration).minusDays(1)`). | Not Started |
| `BASE-03`| Request & Response DTO Layer Setup | **Developer 3 (Lead)** | `BASE-01` | Request and response DTOs implemented in `com.fitsphere.dto` adhering strictly to `docs/API_CONTRACT.md` schemas, decoupling API representations from internal database models. | Not Started |
| `BASE-04`| Validators & Typed Exception Hierarchy | **Developer 2 (Lead)** | `BASE-03` | Domain validators in `com.fitsphere.validator` (`UserValidator`, `PlanValidator`, `ClassValidator`, `SubscriptionValidator`, `BookingValidator`) and typed `AppException` hierarchy in `com.fitsphere.exception` mapping domain failures to HTTP status codes and contract error codes. `UserValidator` strictly enforces approved password policy: minimum 12 characters, maximum 72 UTF-8 bytes, allows spaces and all character types, with no forced composition rules. | Not Started |
| `BASE-05`| BaseServlet Foundation Controller | **Developer 2 (Lead)** | `BASE-04` | `BaseServlet.java` implemented in `com.fitsphere.servlet` providing centralized JSON deserialization, standardized response generation, session identity extraction (`getAuthenticatedUser`), role authorization enforcement (`requireRole`), path parameter parsing, and unified `AppException` error handling. | Not Started |
| `DAO-01` | User & Audit Data Access Objects | **Developer 2 (Lead)** | `BASE-01`, `DB-04` | `UserDAO.java` implemented with parameterized queries (`findById`, `findByEmail`, `insert`, `update`, `updateStatus`, `softDelete`). `AuditLogDAO.java` implemented with append-only `insert` and read query methods (strictly **no update or delete methods** in DAO or service). Both support external transactional `Connection`. | Not Started |
| `DAO-02` | Trainer & Membership Plan DAOs | **Developer 1 (Lead)** | `BASE-01`, `DB-04` | `TrainerDAO.java` implemented with `findAllActive`, `findById`, `insert`, `update`, `softDelete`. `MembershipPlanDAO.java` implemented with `findAllActive`, `findById`, `findByName`, `insert`, `update`, `softDelete`. | Not Started |
| `DAO-03` | Subscription & Payment Data Access Objects | **Developer 2 (Lead)** | `BASE-01`, `DB-04` | `SubscriptionDAO.java` implemented with `insert`, `findById`, `findByUserId`, `updateStatus`, and dynamic validity query helpers. `PaymentDAO.java` implemented with `insert`, `findById`, `findBySubscriptionId`, `findAll`, supporting the composite foreign key `(subscription_id, user_id)`. Both accept transactional `Connection`. | Not Started |
| `DAO-04` | Gym Class & Booking Data Access Objects | **Developer 3 (Lead)** | `BASE-01`, `DB-04` | `GymClassDAO.java` implemented with `findAllBookable`, `findById`, `findByIdForUpdate` (`SELECT ... FOR UPDATE` pessimistic lock), `insert`, `update`, `cancelClass`. `BookingDAO.java` implemented with non-locking lookup `findClassIdByBookingId`, `countActiveByClassId`, `countActiveByUserAndClass`, `findByIdForUpdate`, `insert`, `findByUserId`, and `updateStatusToCancelled`, accepting transactional `Connection` to support Service-orchestrated parent-first locking and bounded deadlock retries. | Not Started |

---

### Phase 3 — Authentication and Authorization Foundation

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `AUTH-01`| BCrypt Password Hashing & Verification | **Developer 1 (Lead)** | `INIT-03` | `PasswordUtil.java` implemented using BCrypt with work factor 12. Validates password constraints (minimum 12 characters, maximum 72 UTF-8 bytes, spaces and all characters allowed, no forced composition rules) and provides secure hash generation and verification for both initial member creation and member password changes. | Not Started |
| `AUTH-02`| Login, Session Identity & Logout Servlets | **Developer 1 (Lead)** | `BASE-01`, `DB-04`, `DAO-01`, `AUTH-01` | `AuthServlet` implements `POST /auth/login`, `GET /auth/me`, and `POST /auth/logout`. Enforces **Session ID regeneration** (`request.changeSessionId()`) on successful login to prevent session fixation, invalidates session (`session.invalidate()`) on logout, and implements in-memory login rate limiting (max 5 failed attempts per IP/minute). Generates a CSRF token using `SecureRandom` when establishing the session, stores it in `session.setAttribute("csrfToken", token)`, returns the newly generated token on `POST /auth/login`, returns the existing session token on `GET /auth/me` (without re-generating), and returns the full 6-field user DTO. | Not Started |
| `AUTH-03`| Role Security Filter, CORS & CSRF Defense | **Developer 2 (Lead)** | `AUTH-02` | `AuthFilter` enforces server-side role validation (`ADMIN`, `MEMBER`), verifies active account status (`account_status = 'ACTIVE'`, invalidating deactivated sessions with 401), and validates `X-CSRF-TOKEN` against the existing session token on authenticated mutating requests (`POST`, `PUT`, `DELETE`, including `POST /auth/logout`), rejecting mismatches with 403 `CSRF_TOKEN_INVALID`. `POST /auth/login` is exempt from session CSRF token check and is protected via strict Origin allowlist validation and existing CORS restrictions. `CorsFilter` allows origin `http://localhost:3000`, adds `X-CSRF-TOKEN` to `Access-Control-Allow-Headers`, sets `Access-Control-Allow-Credentials: true`, and answers `OPTIONS` preflight with `200 OK`. Documents cookie configuration: `HttpOnly=true` in `web.xml`, `SameSite=Lax` via Tomcat's `CookieProcessor` in `META-INF/context.xml`, and `Secure` configured via environment-specific deployment settings (`false` in local HTTP dev, `true` in production HTTPS). | Not Started |
| `AUTH-04`| Frontend AuthContext & Session Hook | Shared | `INIT-02` | Client-side `AuthContext.jsx` manages user state, provides `login`, `logout`, and `useAuth()` hook. *(Live integration with backend verified in `INT-01`)*. | **Completed** |
| `AUTH-05`| Protected Client-Side Route Guards | Shared | `AUTH-04` | Client-side `ProtectedRoute.jsx` redirects unauthenticated users to `/login` and verifies `allowedRoles`. *(Live integration with backend verified in `INT-01`)*. | **Completed** |

---

### Phase 4 — Visitor / Public Development (Developer 1)

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `VIS-01` | Public Navigation Bar, Footer & Layout Shell | **Developer 1** | `INIT-02` | Responsive public header, navigation links, and footer implemented in `features/visitor`; configures `App.jsx` `BrowserRouter` base public routes (`/`, `/trainers`, `/plans`, `/classes`, `/login`). | Not Started |
| `VIS-02` | Public Homepage & Facilities Presentation | **Developer 1** | `VIS-01` | Homepage displaying hero banner, gym facilities, services, and call-to-action sections. | Not Started |
| `VIS-03` | Backend Public Trainers Endpoint | **Developer 1** | `DAO-02`, `BASE-05` | `TrainerService` and `TrainerServlet` handle `GET /trainers` (active only) and `GET /trainers/{id}` returning JSON arrays. | Not Started |
| `VIS-04` | Frontend Public Trainers Grid View | **Developer 1** | `VIS-01` | Public trainers page rendering trainer cards (photo placeholder, name, specialization, contact) using mock data; integrates with `VIS-03` in `INT-02`. | Not Started |
| `VIS-05` | Backend Public Membership Plans Endpoint | **Developer 1** | `DAO-02`, `BASE-05` | `PlanService` and `PlanServlet` handle `GET /plans` (active only) and `GET /plans/{id}`. | Not Started |
| `VIS-06` | Frontend Public Pricing & Plans View | **Developer 1** | `VIS-01` | Public pricing page displaying membership plan cards with duration, price, and descriptions using mock data; integrates with `VIS-05` in `INT-02`. | Not Started |
| `VIS-07` | Backend Public Classes Endpoint | **Developer 1** | `DAO-04`, `BASE-05` | `GymClassService` and `GymClassServlet` handle `GET /classes` and `GET /classes/{id}` calculating `isBookable` dynamically (`SCHEDULED` and strictly future date/time). | Not Started |
| `VIS-08` | Frontend Public Class Schedule Calendar | **Developer 1** | `VIS-01` | Public class schedule displaying upcoming classes, dates, times, trainers, and status badges using mock data; integrates with `VIS-07` in `INT-02`. | Not Started |
| `VIS-09` | Frontend Login Interface | **Developer 1** | `AUTH-04`, `VIS-01` | Login form with email/password validation, error message alerts, and role-based redirect upon login. | Not Started |

---

### Phase 5 — Administrator Development (Developer 2)

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `ADM-01` | Admin Dashboard Layout & Stat Cards | **Developer 2** | `AUTH-03`, `AUTH-05` | Admin dashboard displaying summary metric cards (total members, active subscriptions, scheduled classes, bookings) aggregated from existing contract endpoints (`/users`, `/subscriptions`, `/classes`, `/bookings`); registers `/admin/*` protected routes in `App.jsx`. | Not Started |
| `ADM-02` | Backend Unified 3-in-1 Member Creation | **Developer 2** | `DAO-01`, `DAO-03`, `AUTH-01`, `BASE-05` | `UserService` coordinates `POST /users` creating `users`, `subscriptions`, `payments` (with `recorded_by_admin_id` derived strictly from authenticated session, `payment_method`, optional `receipt_number`), and `audit_logs` atomically in one transaction (`connection.setAutoCommit(false)`) with all 8 mandatory fields. Validates initial password against approved policy (minimum 12 characters, maximum 72 UTF-8 bytes, allows spaces and all character types, no forced composition rules) and hashes with BCrypt work factor 12. | Not Started |
| `ADM-03` | Frontend "Add New Member" Unified Form | **Developer 2** | `ADM-01` | Modal/page form collecting member details, plan selection, payment date, and amount with validation; integrates with `ADM-02` in `INT-03`. | Not Started |
| `ADM-04` | Backend Member Management & Soft Delete | **Developer 2** | `DAO-01`, `BASE-05` | `UserService` implements `GET /users`, `GET /users/{id}`, `PUT /users/{id}`, `PUT /users/{id}/status`, and `DELETE /users/{id}` (Soft Delete: `account_status = 'INACTIVE'`), recording actions atomically in `audit_logs`. | Not Started |
| `ADM-05` | Frontend Member Management Table & Details | **Developer 2** | `ADM-01` | Searchable table of members with status indicators, edit modal, and deactivation action; integrates with `ADM-04` in `INT-03`. | Not Started |
| `ADM-06` | Backend Trainer Administration Servlets | **Developer 2** | `DAO-02`, `AUTH-03`, `BASE-05` | `TrainerServlet` implements `POST /trainers`, `PUT /trainers/{id}`, `PUT /trainers/{id}/status`, and `DELETE /trainers/{id}` (`is_active = FALSE`), recording audit entries. | Not Started |
| `ADM-07` | Frontend Trainer Management Interface | **Developer 2** | `ADM-01` | Admin interface to add, update, and deactivate gym trainers; integrates with `ADM-06` in `INT-03`. | Not Started |
| `ADM-08` | Backend Plan Administration Servlets | **Developer 2** | `DAO-02`, `AUTH-03`, `BASE-05` | `PlanServlet` implements `POST /plans`, `PUT /plans/{id}`, `PUT /plans/{id}/status`, and `DELETE /plans/{id}` (`is_active = FALSE`), recording audit entries. | Not Started |
| `ADM-09` | Frontend Membership Plan Management View | **Developer 2** | `ADM-01` | Admin table to create, edit, and toggle active status of membership plans; integrates with `ADM-08` in `INT-03`. | Not Started |
| `ADM-10` | Backend Subscription Renewal & Administration | **Developer 2** | `DAO-01`, `DAO-03`, `AUTH-03`, `BASE-05` | `SubscriptionService` implements `GET /subscriptions`, `POST /subscriptions` (atomic renewal with new subscription, manual payment, `recorded_by_admin_id` from session, and `audit_logs`), and `PUT /subscriptions/{id}/cancel` (marks subscription `CANCELLED`; payment remains `PAID`). | Not Started |
| `ADM-11` | Frontend Subscription Management Interface | **Developer 2** | `ADM-01` | Subscriptions table with renewal modal and cancellation actions; integrates with `ADM-10` in `INT-03`. | Not Started |
| `ADM-12` | Backend Manual Payment Audit Endpoints | **Developer 2** | `DAO-03`, `AUTH-03`, `BASE-05` | `PaymentServlet` implements `GET /payments`, `GET /payments/{id}`, and `GET /payments/subscription/{subscriptionId}`. | Not Started |
| `ADM-13` | Frontend Payment Audit Log View | **Developer 2** | `ADM-01` | Admin table displaying verified manual payments, associated members, dates, and amounts; integrates with `ADM-12` in `INT-03`. | Not Started |
| `ADM-14` | Backend Gym Class Administration Servlets | **Developer 2** | `DAO-04`, `AUTH-03`, `BASE-05` | `GymClassServlet` implements `POST /classes`, `PUT /classes/{id}`, `PUT /classes/{id}/cancel`, and `PUT /classes/{id}/complete`, recording audit entries. | Not Started |
| `ADM-15` | Frontend Gym Class Schedule Management | **Developer 2** | `ADM-01` | Admin view to create classes, assign trainers, set capacities, and cancel/complete sessions; integrates with `ADM-14` in `INT-03`. | Not Started |
| `ADM-16` | Backend Admin Booking Oversight Servlets | **Developer 2** | `DAO-04`, `AUTH-03`, `BASE-05` | `BookingServlet` implements `GET /bookings` (all bookings with class filters) and `PUT /bookings/{id}/cancel` (admin cancellation releasing capacity). | Not Started |
| `ADM-17` | Frontend Administrative Booking Oversight | **Developer 2** | `ADM-01` | Table of class bookings with filters and administrative cancellation control; integrates with `ADM-16` in `INT-03`. | Not Started |

---

### Phase 6 — Member Development (Developer 3)

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `MEM-01` | Member Dashboard Layout & Welcome View | **Developer 3** | `AUTH-03`, `AUTH-05` | Member dashboard rendering personalized welcome, current subscription status badge, and upcoming bookings widget via existing contract endpoints (`/subscriptions/my`, `/bookings/my`, `/classes`); registers `/member/*` protected routes in `App.jsx`. | Not Started |
| `MEM-02` | Backend Member Profile & Password Change | **Developer 3** | `DAO-01`, `AUTH-01`, `BASE-05` | `UserServlet` handles `GET /users/me`, `PUT /users/me` (strictly `fullName` and `phone`), and `PUT /users/me/password`. Server enforces strict resource ownership (`session.userId == targetUser.id`), validates new password against approved policy (minimum 12 characters, maximum 72 UTF-8 bytes, allows spaces and all character types, no forced composition rules), verifies current password, and updates hash with BCrypt work factor 12 via `PasswordUtil`. | Not Started |
| `MEM-03` | Frontend Member Profile & Security View | **Developer 3** | `MEM-01` | Profile form allowing members to update contact info and change passwords with input validation; integrates with `MEM-02` in `INT-04`. | Not Started |
| `MEM-04` | Backend Member Subscription Retrieval | **Developer 3** | `DAO-03`, `BASE-05` | `SubscriptionServlet` handles `GET /subscriptions/my` returning member history and calculating `isCurrentlyValid` dynamically (`status = 'ACTIVE'` and `CURRENT_DATE BETWEEN start_date AND end_date`). | Not Started |
| `MEM-05` | Frontend Subscription Status Card | **Developer 3** | `MEM-01` | Member subscription view displaying plan name, validity dates, active/expired badge, and renewal instructions; integrates with `MEM-04` in `INT-04`. | Not Started |
| `MEM-06` | Frontend Member Class Browsing & Booking UI | **Developer 3** | `MEM-01` | Class schedule interface highlighting bookable sessions with one-click "Book Class" action using mock data; integrates with `MEM-07` in `INT-04`. | Not Started |
| `MEM-07` | Backend Transactional Class Booking Engine | **Developer 3** | `DAO-03`, `DAO-04`, `BASE-05` | `BookingService` coordinates canonical **8-step parent-first concurrency sequence**:<br>1. Begin Transaction (`connection.setAutoCommit(false)`)<br>2. Lock Parent Class Row First (`SELECT ... FOR UPDATE` via `GymClassDAO`)<br>3. Check Subscription Validity (dynamic active check)<br>4. Check Class Bookability (`SCHEDULED` & strictly future date/time)<br>5. Check No Existing Active Booking (`status = 'BOOKED'`; allows clean rebooking after cancellation)<br>6. Check Available Capacity (`activeCount < capacity`)<br>7. Insert New Booking (`status = 'BOOKED'`)<br>8. Commit Transaction (`connection.commit()`).<br>Includes rollback and bounded retry handling (up to 3 retries with jitter) for MySQL deadlock errors (`Error 1213` / `SQLState 40001`). | Not Started |
| `MEM-08` | Backend Personal Booking Retrieval & Cancel | **Developer 3** | `DAO-04`, `BASE-05` | `BookingServlet` and `BookingService` handle `GET /bookings/my` and `PUT /bookings/{id}/cancel`. `BookingService` coordinates cancellation using strict **parent-first locking order**:<br>1. Begin Transaction (`connection.setAutoCommit(false)`)<br>2. Non-locking lookup to retrieve booking's `class_id`<br>3. Lock Parent `gym_classes` row first (`SELECT ... FOR UPDATE` via `GymClassDAO`)<br>4. Lock `bookings` row (`SELECT ... FOR UPDATE` via `BookingDAO`)<br>5. Verify caller ownership (`session.userId == booking.userId`) and status is `BOOKED`<br>6. Update status to `CANCELLED` (releasing capacity; row is never deleted)<br>7. Commit Transaction (`connection.commit()`).<br>Includes rollback and bounded retry handling for MySQL deadlock errors (`Error 1213` / `SQLState 40001`). | Not Started |
| `MEM-09` | Frontend My Bookings History & Cancellation | **Developer 3** | `MEM-01` | View displaying member's upcoming and past bookings with status badges and "Cancel Booking" action; integrates with `MEM-08` in `INT-04`. | Not Started |

---

### Phase 7 — Frontend/Backend Integration

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `INT-01` | CORS, Session Cookie & CSRF Integration | Shared | `AUTH-02`, `AUTH-03`, `AUTH-04` | Updates `frontend/src/services/api.js` and `AuthContext.jsx` to store `csrfToken` from `/auth/login` and `/auth/me` and attach `X-CSRF-TOKEN` on mutating requests (`POST`, `PUT`, `DELETE`). Verifies `CorsFilter` is mapped before `AuthFilter` in `WEB-INF/web.xml` and browser successfully sends/receives `JSESSIONID` cookies across `http://localhost:3000` (Vite) and `http://localhost:8080` (Tomcat) with `credentials: 'include'`. | Not Started |
| `INT-02` | Visitor Experience Integration Verification | Developer 1 & Shared | `VIS-01`–`VIS-09`, `INT-01` | Public user can seamlessly browse homepage, trainers, plans, public schedule, and proceed to login with real backend responses. | Not Started |
| `INT-03` | Administrator Workflows Integration | Developer 2 & Shared | `ADM-01`–`ADM-17`, `INT-01` | Administrator can create members, assign plans, view payments, schedule classes, and manage bookings end-to-end. | Not Started |
| `INT-04` | Member Workflows Integration | Developer 3 & Shared | `MEM-01`–`MEM-09`, `INT-01` | Member can log in, edit profile, change password, view subscription, book classes, cancel bookings, and inspect booking history. | Not Started |

---

### Phase 8 — Comprehensive Testing and Security Verification

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `TEST-01`| Role-Based Authorization Verification | Shared | `INT-01` | Unauthenticated requests return 401 `AUTHENTICATION_REQUIRED`; cross-role calls (e.g. member calling `/users`, visitor calling `/classes/1/book`) return 403 `ACCESS_DENIED`. | Not Started |
| `TEST-02`| Class Booking Concurrency & Pessimistic Lock Test | Developer 3 & Shared | `MEM-07` | Simulated simultaneous requests for the last remaining seat in a class result in exactly 1 successful booking (`201 Created`) and all others receiving `409 Conflict` (`CLASS_FULL`). Zero capacity overages. | Not Started |
| `TEST-03`| Subscription Dynamic Validity Edge Cases | Developer 3 & Shared | `MEM-04`, `MEM-07` | Verifies that subscriptions before start date, past end date, or with status `CANCELLED` evaluate to `isCurrentlyValid: false` and are blocked from class booking (`403 Forbidden`, `SUBSCRIPTION_REQUIRED`). | Not Started |
| `TEST-04`| Atomic Transaction Rollback & Data Integrity | Developer 2, Developer 3 | `ADM-02`, `ADM-10` | Inducing an artificial SQL failure during 3-in-1 member registration or subscription renewal rolls back all mutations, leaving zero orphaned users, subscriptions, or payments. | Not Started |
| `TEST-05`| Soft Delete & Historical Integrity Audit | Shared | `ADM-04`, `ADM-06`, `ADM-08` | Deleting members, trainers, or plans sets status flags (`INACTIVE`, `is_active = FALSE`) without breaking foreign key constraints or deleting historical subscriptions/bookings/payments. | Not Started |
| `TEST-06`| Secret Hygiene & Git Security Check | Shared | `INT-01` | Automated grep verifies that `.env` is uncommitted, `.gitignore` excludes `node_modules/` and `target/`, and zero plaintext passwords or database credentials exist in source code. | Not Started |
| `TEST-07`| Duplicate Booking Prevention Verification | Developer 3 & Shared | `MEM-07` | Verifies that a member cannot create two active (`BOOKED`) bookings for the same class (`409 Conflict`, `DUPLICATE_BOOKING`). Also verifies that booking after cancellation succeeds by inserting a new record. | Not Started |
| `TEST-08`| Concurrent Booking & Cancellation Race Condition | Developer 3 & Shared | `MEM-07`, `MEM-08` | Stresses simultaneous cancellation and booking on the final class seat, verifying capacity is accurately reclaimed and reassigned, parent-first locking reduces cross-table deadlock risk, and bounded retry gracefully recovers if transient MySQL deadlock (`Error 1213` / `SQLState 40001`) occurs under extreme concurrency. | Not Started |
| `TEST-09`| Input Validation & Boundary Error Handling | Developer 2 & Shared | `BASE-04` | Verifies that invalid emails, short names, non-positive capacities, negative prices, and bad date ranges throw `ValidationException` and return `400 Bad Request` with structured field errors. | Not Started |
| `TEST-10`| Synchronizer CSRF Token & CORS Verification | Developer 2 & Shared | `INT-01` | Verifies `CorsFilter` responds to `OPTIONS` with `200 OK` including `X-CSRF-TOKEN` in `Access-Control-Allow-Headers`, protects `POST /auth/login` via strict Origin allowlist validation, and verifies `AuthFilter` blocks authenticated mutating requests (`POST`, `PUT`, `DELETE`, including `POST /auth/logout`) lacking a valid `X-CSRF-TOKEN` with 403 `CSRF_TOKEN_INVALID`. | Not Started |
| `TEST-11`| Session Cookie Security & Fixation Defense | Developer 1 & Shared | `AUTH-02`, `INT-01` | Verifies session cookie configuration (`HttpOnly=true` in `web.xml`, `SameSite=Lax` via Tomcat `CookieProcessor`, and environment deployment-based `Secure` flag), verifies `request.changeSessionId()` issues a new session ID upon login, and verifies expired sessions return 401 `AUTHENTICATION_REQUIRED`. | Not Started |
| `TEST-12`| Cancelled & Past Class Booking Prevention | Developer 1, Developer 3 | `VIS-07`, `MEM-07` | Verifies that attempting to book a class with `CANCELLED` status, `COMPLETED` status, past calendar date, or past start time today is rejected with `400 Bad Request` (`CLASS_NOT_BOOKABLE`). | Not Started |
| `TEST-13`| Cross-Member Resource Access & IDOR Defense | Developer 3 & Shared | `MEM-02`, `MEM-08` | Verifies that a member cannot view or cancel another member's booking (`PUT /bookings/{otherId}/cancel` returns 403 `ACCESS_DENIED`) or modify another member's profile. | Not Started |

---

### Phase 9 — Final Preparation & Capstone Release

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `REL-01` | Cross-Role Defect Triage & Polish | Shared | `TEST-01`–`TEST-13` | All high-priority bugs resolved; UI responsive and displaying clear success/error toasts. | Not Started |
| `REL-02` | Final Documentation Synchronization | Shared | `REL-01` | `PROJECT_CONTEXT.md`, `README.md`, and all `docs/` files verified as 100% synchronized with the codebase. | Not Started |
| `REL-03` | Demo Seed Data & Final Capstone Walkthrough | Shared | `REL-02`, `DB-03` | System populated with clean demo data for a flawless live presentation covering Visitor, Member, and Admin roles. | Not Started |

---

## 7. Technical Rules & Restrictions Summary

- **Frontend:** React (JavaScript, **not TypeScript**), Vite (port 3000), React Router v6, CSS, Fetch API (`credentials: 'include'`).
- **Backend:** Java 17, Jakarta Servlets (`jakarta.servlet.*`), JDBC with `PreparedStatement`, Apache Tomcat 10.1, Maven, Gson, BCrypt.
- **Strictly Prohibited:** Spring Boot, JSP, Node.js backend, JWT, PostgreSQL, MongoDB, or arbitrary third-party frameworks.
- **API Formats:** JSON with `camelCase` properties, matching database `snake_case` columns.
- **Payments:** Handled physically; recorded via unified `POST /users` or `POST /subscriptions`. No standalone `POST /payments`.
- **Booking Rules:** Class row-locking first (`SELECT ... FOR UPDATE`), strictly future sessions, dynamic subscription validity, history preserved on cancellation, parent-first locking order for booking and cancellation with bounded deadlock retry.
- **Password Policy:** Minimum 12 characters, maximum 72 UTF-8 bytes, allows spaces and all character types, BCrypt work factor 12.
- **CSRF & Cookies:** Synchronizer token (`X-CSRF-TOKEN`) on authenticated mutating requests, `POST /auth/login` protected by Origin validation, `HttpOnly=true`, `SameSite=Lax` (Tomcat `CookieProcessor`), and environment deployment-based `Secure` flag.
