# FitSphere — Project Context

## 1. Project Overview

**Project Name:** FitSphere

**Project Type:** Web-based Gym Management Platform

FitSphere is a web application designed to manage the main operations of a gym, including members, trainers, membership plans, subscriptions, fitness classes, class bookings, and manual payments.

The platform has three user roles:

- **Visitor:** Explores public gym information, trainers, membership plans, and scheduled classes.
- **Member:** Accesses their account, views subscription information, browses classes, manages permitted profile fields, and manages personal bookings.
- **Administrator:** Manages members, trainers, plans, subscriptions, classes, manual payments, and bookings.

The goal is to build a simple, reliable, and maintainable gym management platform without unnecessary complexity.

## 2. Technology Stack

### Frontend
- React.js
- JavaScript (not TypeScript)
- Vite
- React Router
- CSS
- Fetch API

### Backend
- Java 17
- Java Servlets (Jakarta Servlet 6.0)
- JDBC (PreparedStatement, thread-safe connections)
- Apache Tomcat 10.1
- Maven
- Gson
- BCrypt
- 10-layer enterprise architecture: `config`, `model` (entities + enums), `dto` (request/response), `dao`, `service` (business logic + transaction boundaries), `validator`, `exception` (typed AppException hierarchy), `servlet` (BaseServlet + domain controllers), `filter`, `util`

### Database
- MySQL 8.0.16+ (8.0.16+ required for enforced CHECK constraints)
- MySQL Connector/J
- InnoDB storage engine
- Foreign keys, domain check constraints, indexes, and transactions
- 8 tables: `users`, `trainers`, `membership_plans`, `subscriptions`, `gym_classes`, `bookings`, `payments`, `audit_logs`

### Authentication
- HTTP sessions (`HttpSession`)
- Role-based authorization (`PUBLIC`, `MEMBER`, `ADMIN`)
- CORS configured for frontend requests with credentials (`credentials: "include"`)

## 3. Project Structure

FitSphere follows a monorepo structure containing the frontend, backend, database scripts, and documentation.

```text
FitSphere/
├── PROJECT_CONTEXT.md
├── AGENTS.md
├── README.md
├── .gitignore
├── .env.example
│
├── docs/
│   ├── PROJECT_REQUIREMENTS.md
│   ├── DATABASE_SCHEMA.md
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── DEVELOPMENT_WORKFLOW.md
│   └── TASKS.md
│
├── frontend/
│   ├── AGENTS.md
│   ├── package.json
│   └── src/
│
├── backend/
│   ├── AGENTS.md
│   ├── pom.xml
│   └── src/
│
└── database/
    ├── schema.sql
    └── seed.sql
```

## 4. User Roles

### Visitor
- Explore the homepage and gym facilities.
- View trainers.
- Browse membership plans.
- View public gym classes.
- Access the login page.

### Member
- Log in and log out.
- View their dashboard and profile.
- Edit permitted profile fields: `full_name`, `phone`, and `password` (via dedicated change-password endpoint).
- Cannot edit `email`, `role`, or `account_status`.
- View subscription details and expiration date.
- Browse available future classes.
- Book and cancel their own bookings.
- View their complete booking history.

### Administrator
- Access the administrator dashboard.
- Create new members, initial subscriptions, and payment records in a unified workflow.
- Manage trainers (CRUD / Soft Delete).
- Manage membership plans (CRUD / Soft Delete).
- Manage subscriptions and track manual physical payments.
- Manage gym classes (CRUD).
- View and manage bookings.
- Deactivate members, trainers, and plans (Soft Delete).

## 5. Important Business Rules

The following rules must always be respected:

1. **No Self-Registration:** Public self-registration is not allowed. Only administrators can create member accounts.
2. **Payment Before Account:** A member account is created only after payment has been received and verified physically at the gym.
3. **Unified Account Creation Workflow:** Creating a new member, assigning their initial subscription, and recording the manual payment happen in the same administrative workflow, generating 3 distinct records (`users`, `subscriptions`, `payments`). The initial subscription and payment are **mandatory**; creating an account without an initial subscription is prohibited.
4. **Immediate Member Login:** Members receive initial credentials and can log in immediately. Mandatory password change on first login is not required; members can change their password later via their profile.
5. **Separate Entities:** Member accounts, subscriptions, and payments are distinct entities. Each subscription can have at most one payment record.
6. **Subscription Renewal:** Subscription renewal creates a new subscription and payment record for the existing member, not a new user account.
7. **History Preservation:** Previous subscription, payment, and booking records must be preserved for audit and historical tracking.
8. **Soft Delete Policy:** Deleting members, trainers, or plans is implemented as Soft Delete (`account_status = 'INACTIVE'`, `is_active = FALSE`). Physical SQL `DELETE` is prohibited on records referenced by foreign keys.
9. **No Automatic Account Deletion:** Subscription expiration must never delete or disable a member account. Members can still log in when their subscription expires.
10. **Dynamic Subscription Validity:** There is no cron worker. Validity is calculated dynamically: `status = 'ACTIVE' AND CURRENT_DATE BETWEEN start_date AND end_date`. An `ACTIVE` database status past the end date is dynamically treated as expired.
11. **Class Booking Eligibility:** A member can book a class only if they have a valid active subscription AND the class is `SCHEDULED` with a starting date/time in the future (`class_date > CURRENT_DATE OR (class_date = CURRENT_DATE AND start_time > CURRENT_TIME)`).
12. **Booking History & Concurrency:** There is no database unique constraint on `(user_id, class_id)` so cancelled bookings remain in history. When re-booking a cancelled class, a new booking record is inserted. The backend enforces that a member cannot have more than one active (`BOOKED`) booking for the same class by locking the class row first (`SELECT ... FOR UPDATE`), serializing concurrent booking requests inside a database transaction.
13. **Member Cancellation:** Members can cancel only their own bookings, setting the status to `CANCELLED` and releasing class capacity.
14. **In-Person Payments Only:** Payments are made physically at the gym. FitSphere records payments manually and does not process online card payments or collect bank details. Payment records are created exclusively within the unified member creation (`POST /users`) and subscription renewal (`POST /subscriptions`) workflows; standalone payment creation is not supported. One payment record per subscription is strictly enforced.

## 6. Team Organization

The project is developed by three team members using Role-Based Full-Stack Ownership:

| Team member | Main responsibility |
|---|---|
| Developer 1 | Visitor / Public features (Frontend & Backend) |
| Developer 2 | Administrator features (Frontend & Backend) |
| Developer 3 | Member features (Frontend & Backend) + Exclusive Database Owner (`schema.sql`, `seed.sql`, DB config) |

Shared responsibilities include:
- Reviewing database schema requirements following `docs/DATABASE_SCHEMA.md` (implemented exclusively by Developer 3).
- Authentication and session management (`AuthFilter`, `AuthContext`).
- Shared models and base DAO classes.
- API contract definition.
- Frontend/backend integration.
- Testing and security.

## 7. Architecture Principles

### Frontend
- Reusable React components organized by user role (`features/visitor`, `admin`, `member`, `components/common`).
- Centralized API communication via `src/services/api.js` enforcing `credentials: "include"`.
- React Router with route guards (`ProtectedRoute.jsx`).

### Backend
- Layered Jakarta Servlet architecture: `model/`, `dao/`, `servlet/`, `config/`, `filter/`, `util/`.
- JDBC with `PreparedStatement` and MySQL InnoDB transactions.
- Gson for JSON responses with consistent status codes.
- BCrypt for password hashing.
- Server-side session authentication (`HttpSession`).

### Database
- 8 MySQL tables: `users`, `trainers`, `membership_plans`, `subscriptions`, `gym_classes`, `bookings`, `payments`, `audit_logs`.
- Foreign keys with `ON DELETE RESTRICT` to protect historical data integrity.

## 8. Technical Restrictions

- No Spring Boot.
- No JSP.
- No Node.js backend.
- No TypeScript for frontend.
- No JWT authentication (HTTP sessions only).
- No online payment gateway integrations.
- Jakarta Servlet APIs compatible with Apache Tomcat 10.1.

## 9. Security and Configuration

- BCrypt password hashing. Never store or return plaintext passwords.
- Role-based authorization enforced on the backend.
- Sensitive credentials loaded via environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).
- Never commit real `.env` files.

## 10. Documentation Reference

| Document | Purpose |
|---|---|
| `PROJECT_REQUIREMENTS.md` | Functional and non-functional requirements |
| `DATABASE_SCHEMA.md` | Database tables, fields, and relationships |
| `ARCHITECTURE.md` | Frontend and backend architecture |
| `API_CONTRACT.md` | API endpoints and request/response formats |
| `DEVELOPMENT_WORKFLOW.md` | Team responsibilities and Git workflow |
| `TASKS.md` | Development task breakdown |
