# FitSphere — Implementation Task Roadmap

## 1. Overview and Purpose

This document translates the approved FitSphere system requirements, database schema, architecture, and API contracts into an actionable, phased development roadmap for the 3-developer team.

Each task specifies:
- Unique identifier.
- Descriptive title and summary.
- Responsible owner (**Developer 1**, **Developer 2**, **Developer 3**, or **Shared**).
- Prerequisites and task dependencies.
- Clear, verifiable completion criteria.
- Current status (`Not Started`, `In Progress`, or `Completed`).

---

## 2. Team Role Assignments

The team operates on a **Role-Based Full-Stack Ownership** model:

| Role | Team Member | Scope of Ownership |
|---|---|---|
| **Visitor / Public** | **Developer 1** | Public homepage, navigation, gym services, trainer listing, pricing plans, public class schedule, login UI, and corresponding public backend endpoints. |
| **Administrator** | **Developer 2** | Admin dashboard, unified member creation, member CRUD, trainer CRUD, plan CRUD, subscription renewal, payment audit tracking, class management, administrative booking oversight, and admin-only backend servlets. |
| **Member & Database** | **Developer 3** | **Dual Responsibility:**<br>1. **Database Owner:** MySQL database creation, `database/schema.sql`, `seed.sql`, 7 tables, constraints, indexes, and connection verification.<br>2. **Member Features:** Member dashboard, profile editing, password change, subscription history, class booking with row locking, personal booking history, cancellation, and member servlets. |
| **Shared Core** | **Shared (All 3)** | Database connectivity setup, shared models, base DAOs, authentication/session management (`AuthServlet`, `AuthFilter`), API contract coordination, and integration testing. |

### Database Ownership and Coordination Rules
- **Developer 3 is the exclusive owner of database creation and setup.**
- The database schema must strictly adhere to [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/DATABASE_SCHEMA.md).
- Developers 1 and 2 must communicate any query or data requirements to Developer 3 and must **not** independently alter database tables or column structures.
- Schema creation (`DB-01`, `DB-02`, `DB-03`) is a critical prerequisite for all database-backed servlets.

### Shared Backend Implementation Leads & Coordination Rules
To prevent ambiguity, merge collisions, or implementation deadlock while maintaining shared architectural standards, the team has designated specific **primary implementation leads** for foundational backend tasks:
- **Developer 3 (Lead):** Implements `DB-04` (`DatabaseConfig.java` / `DatabaseConnection.java`), `BASE-01` (POJO entity models), and `BASE-02` (`JsonUtil.java`). Developer 3 remains the **exclusive database owner** (`DB-01` through `DB-03`).
- **Developer 1 (Lead):** Implements `AUTH-01` (`PasswordUtil.java`) and `AUTH-02` (`AuthServlet.java`), driving session login, logout, and session identity endpoints aligned with the visitor login UI.
- **Developer 2 (Lead):** Implements `AUTH-03` (`AuthFilter.java` and `CorsFilter.java`), establishing server-side role validation, CORS preflight handling, and security filters for admin-protected and member routes.

**Important Coordination Rules:**
- These assignments designate **primary implementation leads**, not permission to change shared architecture or database models independently.
- Shared authentication/session behavior, interfaces, session attribute keys (e.g. `userId`, `role`), JSON response formats, and integration points must be strictly coordinated between the relevant developers.
- All implementations must strictly conform to [`docs/API_CONTRACT.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/API_CONTRACT.md), [`docs/ARCHITECTURE.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/ARCHITECTURE.md), and [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/DATABASE_SCHEMA.md).

---

## 3. Dependency Graph & Parallel Workstreams

```text
[Phase 1: Project Init] (INIT-01 to 04)
          │
          ▼
[Phase 2: Database & Base Backend]
 ├── Developer 3: DB Setup (DB-01, 02, 03) ──────────────┐
 └── Shared: Connection & Models (DB-04, BASE-01, 02) ◄──┘
          │
          ▼
[Phase 3: Authentication & Security] (AUTH-01 to 05)
          │
          ├─────────────────────────┬─────────────────────────┐
          ▼                         ▼                         ▼
   [Phase 4: Visitor]       [Phase 5: Admin]          [Phase 6: Member]
     (Developer 1)            (Developer 2)             (Developer 3)
   • Public Pages & Nav     • Member 3-in-1 Form      • Member Dashboard
   • Public Servlets        • Admin CRUD Servlets     • Class Booking (Lock)
   • Login Interface        • Payment Tracking        • Profile & History
          │                         │                         │
          └─────────────────────────┼─────────────────────────┘
                                    ▼
                     [Phase 7: System Integration] (INT-01 to 04)
                                    │
                                    ▼
                     [Phase 8: Security & Testing] (TEST-01 to 06)
                                    │
                                    ▼
                     [Phase 9: Final Demo Release] (REL-01 to 03)
```

### Parallel Development Opportunities
- While Developer 3 implements the database schema (`DB-01`–`DB-03`), Developers 1 and 2 can build frontend page layouts and static UI components using mock data.
- Once Phase 3 (Authentication) is complete, **Phases 4, 5, and 6 can be developed simultaneously** by the three developers in their respective feature branches without blocking each other.

---

## 4. Detailed Phased Task List

### Phase 1 — Project Initialization

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `INIT-01` | Monorepo Structure & Git Configuration | Shared | None | Root repository initialized with `README.md`, `.gitignore`, `.env.example`, and baseline documentation structure. | **Completed** |
| `INIT-02` | React + Vite Frontend Initialization | Developer 1 & Shared | `INIT-01` | React app with React Router v6, folder structure, and service stubs compiles cleanly via `npm run build`. | **Completed** |
| `INIT-03` | Java 17 + Tomcat 10.1 Maven Setup | Shared | `INIT-01` | `pom.xml` configured with Jakarta Servlet 6.0, MySQL Connector/J, Gson, jBCrypt; `web.xml` configured for sessions. | **Completed** |
| `INIT-04` | Local Developer Environment Verification | Shared | `INIT-02`, `INIT-03` | Each developer verifies local Java 17/25 JDK, Node.js, and local `.env` configuration. | **Completed** |

---

### Phase 2 — Database Creation & Shared Backend Foundation

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `DB-01` | MySQL Database & Table Schema Definition | **Developer 3** | `INIT-04` | `database/schema.sql` written with all 7 tables (`users`, `trainers`, `membership_plans`, `subscriptions`, `gym_classes`, `bookings`, `payments`) using InnoDB and utf8mb4. | Not Started |
| `DB-02` | Table Constraints, Foreign Keys & Indexes | **Developer 3** | `DB-01` | Primary keys, foreign keys (`RESTRICT` policies), unique indexes (`users.email`, `plans.name`, `payments.subscription_id`), and query indexes implemented in `schema.sql`. | Not Started |
| `DB-03` | Demo Seed Data Script Implementation | **Developer 3** | `DB-02` | `database/seed.sql` prepared with sample admin, members, trainers, plans, classes, and initial payments with BCrypt password hashes. | Not Started |
| `DB-04` | Database Connection Lifecycle & Config | **Developer 3 (Lead)** | `DB-02` | Java `DatabaseConfig.java` implemented to load credentials from environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`), throwing `IllegalStateException` on missing variables, and providing thread-safe JDBC connections. | Not Started |
| `BASE-01`| Shared Java Entity Models (POJOs) | **Developer 3 (Lead)** | `DB-02` | Models created in `com.fitsphere.model` for all 7 entities with getters, setters, constructors, and matching camelCase properties. | Not Started |
| `BASE-02`| JSON Serialization & Base Utility Setup | **Developer 3 (Lead)** | `INIT-03` | `JsonUtil.java` configured with Gson for standardized response envelopes; `PasswordUtil.java` configured for BCrypt hashing. | Not Started |

---

### Phase 3 — Authentication and Authorization

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `AUTH-01`| BCrypt Password Hashing & Verification | **Developer 1 (Lead)** | `BASE-02` | `PasswordUtil` verifies candidate passwords against stored BCrypt hashes, enforcing minimum 6-character length and no whitespace. | Not Started |
| `AUTH-02`| Login, Session Identity & Logout Servlets | **Developer 1 (Lead)** | `BASE-01`, `DB-04` | `AuthServlet` implements `POST /auth/login`, `GET /auth/me`, and `POST /auth/logout` managing standard `HttpSession` and session cookies. | Not Started |
| `AUTH-03`| Role Security Filter & CORS Configuration | **Developer 2 (Lead)** | `AUTH-02` | `AuthFilter` and `CorsFilter` intercept requests, enforce server-side role validation (`ADMIN`, `MEMBER`), handle `OPTIONS` preflight, and set `Access-Control-Allow-Credentials: true`. | Not Started |
| `AUTH-04`| Frontend AuthContext & Session Hook | Shared | `AUTH-02` | `AuthContext.jsx` restores user state via `GET /auth/me` on mount, handles `login` and `logout`, exposing `useAuth()` hook. | **Completed** |
| `AUTH-05`| Protected Client-Side Route Guards | Shared | `AUTH-04` | `ProtectedRoute.jsx` redirects unauthenticated users to `/login` and verifies `allowedRoles`. | **Completed** |

---

### Phase 4 — Visitor / Public Development (Developer 1)

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `VIS-01` | Public Navigation Bar, Footer & Layout Shell | **Developer 1** | `INIT-02` | Responsive public header, navigation links, and footer implemented in `features/visitor`. | Not Started |
| `VIS-02` | Public Homepage & Facilities Presentation | **Developer 1** | `VIS-01` | Homepage displaying hero banner, gym facilities, services, and call-to-action sections. | Not Started |
| `VIS-03` | Backend Public Trainers Endpoint | **Developer 1** | `BASE-01`, `DB-04` | `TrainerServlet` handles `GET /trainers` (active only) and `GET /trainers/{id}` returning JSON arrays. | Not Started |
| `VIS-04` | Frontend Public Trainers Grid View | **Developer 1** | `VIS-03`, `VIS-01` | Public trainers page rendering trainer cards (photo placeholder, name, specialization, contact). | Not Started |
| `VIS-05` | Backend Public Membership Plans Endpoint | **Developer 1** | `BASE-01`, `DB-04` | `PlanServlet` handles `GET /plans` (active only) and `GET /plans/{id}`. | Not Started |
| `VIS-06` | Frontend Public Pricing & Plans View | **Developer 1** | `VIS-05`, `VIS-01` | Public pricing page displaying membership plan cards with duration, price, and descriptions. | Not Started |
| `VIS-07` | Backend Public Classes Endpoint | **Developer 1** | `BASE-01`, `DB-04` | `GymClassServlet` handles `GET /classes` and `GET /classes/{id}` calculating `isBookable` dynamically. | Not Started |
| `VIS-08` | Frontend Public Class Schedule Calendar | **Developer 1** | `VIS-07`, `VIS-01` | Public class schedule displaying upcoming classes, dates, times, trainers, and status badges. | Not Started |
| `VIS-09` | Frontend Login Interface | **Developer 1** | `AUTH-04`, `VIS-01` | Login form with email/password validation, error message alerts, and role-based redirect upon login. | Not Started |

---

### Phase 5 — Administrator Development (Developer 2)

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `ADM-01` | Admin Dashboard Layout & Stat Cards | **Developer 2** | `AUTH-03`, `AUTH-05` | Admin dashboard displaying summary metric cards (total members, active subscriptions, scheduled classes, bookings). | Not Started |
| `ADM-02` | Backend Unified 3-in-1 Member Creation | **Developer 2** | `AUTH-03`, `DB-04` | `POST /users` creates `users`, `subscriptions`, and `payments` atomically in one transaction with all 8 mandatory fields. | Not Started |
| `ADM-03` | Frontend "Add New Member" Unified Form | **Developer 2** | `ADM-02`, `VIS-05` | Modal/page form collecting member details, plan selection, payment date, and amount with validation. | Not Started |
| `ADM-04` | Backend Member Management & Soft Delete | **Developer 2** | `ADM-02` | `UserServlet` implements `GET /users`, `GET /users/{id}`, `PUT /users/{id}`, `PUT /users/{id}/status`, and `DELETE /users/{id}` (Soft Delete: `account_status = 'INACTIVE'`). | Not Started |
| `ADM-05` | Frontend Member Management Table & Details | **Developer 2** | `ADM-04` | Searchable table of members with status indicators, edit modal, and deactivation action. | Not Started |
| `ADM-06` | Backend Trainer Administration Servlets | **Developer 2** | `VIS-03` | `TrainerServlet` implements `POST /trainers`, `PUT /trainers/{id}`, `PUT /trainers/{id}/status`, and `DELETE /trainers/{id}` (`is_active = FALSE`). | Not Started |
| `ADM-07` | Frontend Trainer Management Interface | **Developer 2** | `ADM-06` | Admin interface to add, update, and deactivate gym trainers. | Not Started |
| `ADM-08` | Backend Plan Administration Servlets | **Developer 2** | `VIS-05` | `PlanServlet` implements `POST /plans`, `PUT /plans/{id}`, `PUT /plans/{id}/status`, and `DELETE /plans/{id}` (`is_active = FALSE`). | Not Started |
| `ADM-09` | Frontend Membership Plan Management View | **Developer 2** | `ADM-08` | Admin table to create, edit, and toggle active status of membership plans. | Not Started |
| `ADM-10` | Backend Subscription Renewal & Administration | **Developer 2** | `DB-04`, `AUTH-03` | `SubscriptionServlet` implements `GET /subscriptions`, `POST /subscriptions` (atomic renewal with payment), and `PUT /subscriptions/{id}/cancel`. | Not Started |
| `ADM-11` | Frontend Subscription Management Interface | **Developer 2** | `ADM-10` | Subscriptions table with renewal modal and cancellation actions. | Not Started |
| `ADM-12` | Backend Manual Payment Audit Endpoints | **Developer 2** | `DB-04`, `AUTH-03` | `PaymentServlet` implements `GET /payments`, `GET /payments/{id}`, and `GET /payments/subscription/{subscriptionId}`. | Not Started |
| `ADM-13` | Frontend Payment Audit Log View | **Developer 2** | `ADM-12` | Admin table displaying verified manual payments, associated members, dates, and amounts. | Not Started |
| `ADM-14` | Backend Gym Class Administration Servlets | **Developer 2** | `VIS-07` | `GymClassServlet` implements `POST /classes`, `PUT /classes/{id}`, `PUT /classes/{id}/cancel`, and `PUT /classes/{id}/complete`. | Not Started |
| `ADM-15` | Frontend Gym Class Schedule Management | **Developer 2** | `ADM-14` | Admin view to create classes, assign trainers, set capacities, and cancel/complete sessions. | Not Started |
| `ADM-16` | Backend Admin Booking Oversight Servlets | **Developer 2** | `DB-04`, `AUTH-03` | `BookingServlet` implements `GET /bookings` (all bookings with class filters) and `PUT /bookings/{id}/cancel`. | Not Started |
| `ADM-17` | Frontend Administrative Booking Oversight | **Developer 2** | `ADM-16` | Table of class bookings with filters and administrative cancellation control. | Not Started |

---

### Phase 6 — Member Development (Developer 3)

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `MEM-01` | Member Dashboard Layout & Welcome View | **Developer 3** | `AUTH-03`, `AUTH-05` | Member dashboard rendering personalized welcome, current subscription status badge, and upcoming bookings widget. | Not Started |
| `MEM-02` | Backend Member Profile & Password Change | **Developer 3** | `AUTH-03`, `BASE-01` | `UserServlet` handles `GET /users/me`, `PUT /users/me` (strictly `fullName` and `phone`), and `PUT /users/me/password` (BCrypt verification and update). | Not Started |
| `MEM-03` | Frontend Member Profile & Security View | **Developer 3** | `MEM-02` | Profile form allowing members to update contact info and change passwords with input validation. | Not Started |
| `MEM-04` | Backend Member Subscription Retrieval | **Developer 3** | `DB-04`, `AUTH-03` | `SubscriptionServlet` handles `GET /subscriptions/my` returning member history and calculating `isCurrentlyValid` dynamically. | Not Started |
| `MEM-05` | Frontend Subscription Status Card | **Developer 3** | `MEM-04` | Member subscription view displaying plan name, validity dates, active/expired badge, and renewal instructions. | Not Started |
| `MEM-06` | Frontend Member Class Browsing & Booking UI | **Developer 3** | `VIS-07`, `MEM-04` | Class schedule interface highlighting bookable sessions with one-click "Book Class" action. | Not Started |
| `MEM-07` | Backend Transactional Class Booking Engine | **Developer 3** | `DB-04`, `AUTH-03` | `POST /bookings` executes exact 8-step sequence: row lock on class (`FOR UPDATE`) -> subscription validity -> future check -> duplicate active check -> capacity check -> `INSERT` -> commit. | Not Started |
| `MEM-08` | Backend Personal Booking Retrieval & Cancel | **Developer 3** | `MEM-07` | `BookingServlet` handles `GET /bookings/my` (including booked/cancelled history) and `PUT /bookings/{id}/cancel` (releasing capacity). | Not Started |
| `MEM-09` | Frontend My Bookings History & Cancellation | **Developer 3** | `MEM-08` | View displaying member's upcoming and past bookings with status badges and "Cancel Booking" action. | Not Started |

---

### Phase 7 — Frontend/Backend Integration

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `INT-01` | CORS & Session Cookie Integration | Shared | `AUTH-03`, `AUTH-04` | Browser successfully sends and receives `JSESSIONID` cookies across `http://localhost:3000` and `http://localhost:8080`. | Not Started |
| `INT-02` | Visitor Experience Integration Verification | Developer 1 & Shared | `VIS-01`–`VIS-09`, `INT-01` | Public user can seamlessly browse homepage, trainers, plans, public schedule, and proceed to login. | Not Started |
| `INT-03` | Administrator Workflows Integration | Developer 2 & Shared | `ADM-01`–`ADM-17`, `INT-01` | Administrator can create members, assign plans, view payments, schedule classes, and manage bookings. | Not Started |
| `INT-04` | Member Workflows Integration | Developer 3 & Shared | `MEM-01`–`MEM-09`, `INT-01` | Member can log in, edit profile, view subscription, book classes, cancel bookings, and inspect booking history. | Not Started |

---

### Phase 8 — Testing and Security

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `TEST-01`| Role-Based Authorization Verification | Shared | `INT-01` | Unauthenticated requests to protected endpoints return 401; cross-role access (e.g. member calling `/users`) returns 403. | Not Started |
| `TEST-02`| Class Booking Concurrency & Lock Stress Test| Developer 3 & Shared | `MEM-07` | Simulated simultaneous requests for the last remaining seat in a class result in exactly 1 booking and 409 `CLASS_FULL` for the others. | Not Started |
| `TEST-03`| Subscription Validity & Expiration Edge Cases| Developer 3 & Shared | `MEM-04` | Subscriptions before start date or past end date return `isCurrentlyValid: false` and are blocked from booking. | Not Started |
| `TEST-04`| Atomic Multi-Record Rollback Verification | Developer 2, Developer 3 | `ADM-02`, `ADM-10` | Inducing an error during member or renewal creation completely rolls back changes, leaving no orphaned accounts or payments. | Not Started |
| `TEST-05`| Soft Delete & Historical Integrity Audit | Shared | `ADM-04`, `ADM-06`, `ADM-08` | Deleting members, trainers, or plans deactivates them without breaking foreign key relationships or historical views. | Not Started |
| `TEST-06`| Secret Hygiene & Git Security Check | Shared | `INT-01` | Verification that `.env` is uncommitted, `.gitignore` excludes `node_modules/` and `target/`, and no hardcoded DB passwords exist. | Not Started |

---

### Phase 9 — Final Preparation

| Task ID | Task Title | Owner | Dependencies | Completion Criteria | Status |
|---|---|---|---|---|:---:|
| `REL-01` | Cross-Role Defect Triage & Polish | Shared | `TEST-01`–`TEST-06` | All high-priority bugs resolved; UI responsive and displaying clear success/error toasts. | Not Started |
| `REL-02` | Final Documentation Synchronization | Shared | `REL-01` | `PROJECT_CONTEXT.md`, `README.md`, and all `docs/` files verified as 100% synchronized with the codebase. | Not Started |
| `REL-03` | Demo Seed Data & Final Capstone Walkthrough| Shared | `REL-02`, `DB-03` | System populated with clean demo data for a flawless live presentation covering Visitor, Member, and Admin roles. | Not Started |

---

## 5. Technical Rules & Restrictions Summary

- **Frontend:** React (JavaScript, **not TypeScript**), Vite, React Router, CSS, Fetch API (`credentials: 'include'`).
- **Backend:** Java 17, Jakarta Servlets (`jakarta.servlet.*`), JDBC, Apache Tomcat 10.1, Maven, Gson, BCrypt.
- **Strictly Prohibited:** Spring Boot, JSP, Node.js backend, JWT, PostgreSQL, MongoDB, or arbitrary third-party frameworks.
- **API Formats:** JSON with `camelCase` properties, matching database snake_case columns.
- **Payments:** Handled physically; recorded via unified `POST /users` or `POST /subscriptions`. No standalone `POST /payments`.
- **Booking Rules:** Class row-locking first (`SELECT ... FOR UPDATE`), strictly future sessions, dynamic subscription validity, history preserved on cancellation.
