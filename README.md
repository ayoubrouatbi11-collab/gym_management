# FitSphere — University Gym Management Platform

FitSphere is a web-based gym management platform designed to streamline administrative workflows, membership tracking, class scheduling, and member reservations for a university fitness facility.

Developed as a university capstone project by a 3-developer team over an intensive ~14-day development lifecycle, FitSphere emphasizes a clean separation of concerns, reliable data integrity, and strict concurrency control.

---

## Table of Contents

1. [Project Purpose & Overview](#project-purpose--overview)
2. [Main Features by Role](#main-features-by-role)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites & System Requirements](#prerequisites--system-requirements)
6. [Installation & Cloning](#installation--cloning)
7. [Environment Configuration](#environment-configuration)
8. [Database Setup](#database-setup)
9. [Running the Application](#running-the-application)
10. [Team Responsibilities & Ownership](#team-responsibilities--ownership)
11. [Git Collaboration Workflow](#git-collaboration-workflow)
12. [Documentation Directory](#documentation-directory)

---

## 1. Project Purpose & Overview

FitSphere bridges the gap between public visitors, registered gym members, and administrative staff. It automates membership status tracking, class scheduling, and seat capacity management while reflecting real-world university facility operations:

- **In-Person Manual Payments:** FitSphere does **not** integrate third-party online payment gateways (such as Stripe or PayPal). All payments take place in person at the gym reception desk via cash or physical card terminal. Administrators verify the receipt and record the payment into the platform simultaneously when creating or renewing a membership subscription.
- **Strict Concurrency Protection:** Class bookings enforce pessimistic row-level locking (`SELECT ... FOR UPDATE`) inside database transactions to prevent overbooking and double reservations under concurrent traffic.
- **Soft Deletion & Audit History:** Member profiles, trainers, and plans use active/inactive status flags rather than physical row deletion, preserving historical payment and booking records for reporting and auditing.

---

## 2. Main Features by Role

### Visitor / Public Experience (Unauthenticated)
- **Landing Page & Navigation:** Clean introduction to gym facilities, equipment, operating hours, and amenities.
- **Trainers Directory:** Public profiles highlighting trainer bios, specialties, and qualifications.
- **Membership Plans Catalog:** Transparent display of available plans, pricing tiers, and duration options.
- **Class Schedule:** Real-time visibility into weekly gym classes, scheduled times, instructor assignments, and available capacities.
- **Login Modal:** Unified, secure entry point for members and administrators.

### Administrator Experience
- **Overview Dashboard:** Operational metrics summarizing active members, registered trainers, active plans, and daily classes.
- **Unified Member Creation:** Atomically registers a member, provisions their initial membership plan, and records the initial in-person payment within a single database transaction.
- **Member Management:** View, search, update profiles, and deactivate/reactivate member accounts.
- **Subscription Renewal:** Extend member access with new plan subscriptions and associated manual in-person payment records.
- **Payment Audit Log:** Read-only ledger of all recorded in-person payments cross-referenced by member and subscription ID. *(Note: There is no standalone `POST /payments` endpoint; payments are created strictly within subscription registration workflows).*
- **Trainer & Plan CRUD:** Create, edit, and deactivate trainer profiles and membership pricing plans.
- **Class Scheduling & Attendance Oversight:** Create, update, or cancel classes, set maximum capacities, and inspect enrolled rosters.

### Member Experience
- **Member Dashboard:** Personal hub displaying active subscription validity, days remaining, and upcoming booked sessions.
- **Profile & Password Management:** Update personal contact details and optionally change password (mandatory first-login password change is not required).
- **Class Booking Engine:** Browse upcoming classes and reserve seats with atomic capacity deduction.
- **Booking History & Cancellation:** Review past and upcoming bookings, with the ability to cancel bookings prior to class start time (updating status to `CANCELLED` and restoring available class capacity).
- **Subscription Ledger:** Read-only view of current and historical subscriptions and their verified payment amounts.

---

## 3. Technology Stack

FitSphere enforces a decoupled client-server architecture using only approved technologies:

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | **React.js 18** | Client-side application using standard JavaScript (ES Modules, not TypeScript) |
| **Frontend Tooling** | **Vite 6** | Fast local dev server, module bundler, and optimized production builder |
| **Routing** | **React Router 6** | Declarative client-side routing with role-based protected route wrappers |
| **HTTP Client** | **Fetch API** | Native `fetch` with `credentials: 'include'` for secure session cookie exchange |
| **Styling** | **CSS3** | Modern vanilla CSS with responsive design and theme variables |
| **Backend Runtime** | **Java 17** | Jakarta EE 10 compatible backend compiled to Java 17 release bytecode |
| **Servlet Container** | **Apache Tomcat 10.1** | Implements the **Jakarta Servlet 6.0** specification (`jakarta.servlet.*`) |
| **Data Persistence** | **JDBC** | Raw Java Database Connectivity with `PreparedStatement` and manual transaction boundaries |
| **Relational Database** | **MySQL 8.0.16+** | InnoDB storage engine, 8 relational tables, foreign key constraints, domain checks, `utf8mb4` encoding |
| **Serialization** | **Google Gson 2.10** | High-performance JSON parsing and serialization |
| **Security / Hashing** | **jBCrypt 0.4** | Strong salted BCrypt password hashing |
| **Build Tool (Backend)**| **Apache Maven 3.8+** | Packaging backend artifact as `fitsphere.war` |

> **Prohibited Technologies:** Spring Boot, JSP, Node.js backend runtimes, TypeScript, JWT (JSON Web Tokens), MongoDB, and PostgreSQL are strictly prohibited per project guidelines.

---

## 4. Project Structure

```text
gym_management/
├── README.md                     # Main project documentation, setup, and run instructions
├── PROJECT_CONTEXT.md            # Central project status and architectural source of truth
├── AGENTS.md                     # Development rules and boundaries for AI agents and teammates
├── .gitignore                    # Git ignore specifications (node_modules, target, .env, IDEs)
├── .env.example                  # Template configuration for local environment credentials
│
├── database/                     # Database scripts (Owned exclusively by Developer 3)
│   ├── schema.sql                # DDL: 8 InnoDB tables, constraints, indexes [Pending Dev 3 implementation]
│   └── seed.sql                  # DML: Default administrator, sample trainers, plans, classes [Pending Dev 3 implementation]
│
├── docs/                         # Formal project documentation
│   ├── PROJECT_REQUIREMENTS.md   # Functional and non-functional system requirements
│   ├── DATABASE_SCHEMA.md        # Relational schema specifications, fields, and constraints
│   ├── ARCHITECTURE.md           # System design, transaction boundaries, and state management
│   ├── API_CONTRACT.md           # Endpoints, payloads, query parameters, and error schemas
│   ├── DEVELOPMENT_WORKFLOW.md   # Git lifecycle, branching, pull requests, and commit guidelines
│   └── TASKS.md                  # Implementation roadmap with 9 development phases
│
├── frontend/                     # React + Vite client-side application
│   ├── index.html                # Single-page application root HTML
│   ├── vite.config.js            # Vite configuration (Port 3000)
│   ├── package.json              # Frontend scripts and dependencies
│   └── src/
│       ├── App.jsx               # Application root with client router
│       ├── main.jsx              # DOM entry point
│       ├── context/              # AuthContext for shared session state
│       ├── routes/               # ProtectedRoute and role-based guards
│       ├── services/             # Centralized API service clients (auth, users, classes, etc.)
│       ├── components/           # Reusable UI elements (visitor, admin, member, common)
│       └── features/             # Role-specific feature pages and components
│
└── backend/                      # Java 17 Jakarta Servlet backend application
    ├── pom.xml                   # Maven build configuration producing fitsphere.war
    └── src/main/
        ├── java/com/fitsphere/
        │   ├── config/           # DatabaseConnection pool and app constants [Pending Phase 2]
        │   ├── model/            # Plain Java model entities and enums [Pending Phase 2]
        │   ├── dto/              # Request and Response Data Transfer Objects [Pending Phase 2+]
        │   ├── dao/              # JDBC Data Access Objects with parameterized SQL [Pending Phase 2+]
        │   ├── service/          # Domain services with transaction and lock boundaries [Pending Phase 2+]
        │   ├── validator/        # Request payload validators [Pending Phase 2+]
        │   ├── exception/        # Typed AppException hierarchy [Pending Phase 2]
        │   ├── servlet/          # Jakarta Servlets extending BaseServlet [Pending Phases 3–6]
        │   ├── filter/           # AuthFilter and CorsFilter [Pending Phase 3]
        │   └── util/             # BaseServlet, JsonUtil, PasswordUtil helpers [Pending Phase 2]
        └── webapp/
            └── WEB-INF/
                └── web.xml       # Servlet 6.0 deployment descriptor and cookie session config
```

---

## 5. Prerequisites & System Requirements

Before running FitSphere, ensure the following tools are installed on your workstation:

| Software | Required Version | Verification Command |
|---|---|---|
| **Node.js** | 18.x or 20.x LTS | `node -v` |
| **npm** | 9.x or 10.x | `npm -v` |
| **Java JDK** | 17 (or compatible JDK 17–25) | `java -version` |
| **Apache Maven** | 3.8.x or 3.9.x | `mvn -v` |
| **Apache Tomcat** | 10.1.x (Jakarta EE 10) | Available in local application server path |
| **MySQL Server** | 8.0.16 or higher | `mysql --version` |
| **Git** | 2.30.x or higher | `git --version` |

---

## 6. Installation & Cloning

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/gym_management.git
   cd gym_management
   ```

2. **Verify working branches:**
   Check out the integration branch `development` for active development:
   ```bash
   git checkout development
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

## 7. Environment Configuration

FitSphere reads database connection details from environment variables or a local configuration file. 

1. **Create the environment file:**
   Copy the provided `.env.example` in the project root:
   ```bash
   cp .env.example .env
   ```

2. **Configure your local database credentials:**
   Edit `.env` to match your local MySQL configuration:
   ```properties
   # FitSphere — Environment Configuration Template
   # Copy this file to .env and adjust values for your local environment.
   # NEVER commit the actual .env file with real credentials.

   # Database Configuration
   DB_URL=jdbc:mysql://localhost:3306/fitsphere
   DB_USERNAME=your_mysql_username
   DB_PASSWORD=your_mysql_password
   ```

3. **Frontend API Configuration (Optional):**
   By default, the React frontend connects to `http://localhost:8080/fitsphere/api`. If you need to override the backend target, create `frontend/.env`:
   ```properties
   VITE_API_BASE_URL=http://localhost:8080/fitsphere/api
   ```

---

## 8. Database Setup

> [!IMPORTANT]
> **Database Ownership:** Developer 3 is the **exclusive owner** of the database schema, table definitions, constraints, indexes, and seed scripts. Developers 1 and 2 must not alter table structures or create ad-hoc database modifications.

1. **Start the MySQL Server:**
   Ensure MySQL service is running locally on port `3306`.

2. **Create the Database:**
   ```sql
   CREATE DATABASE fitsphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Execute DDL & Seed Scripts:**
   *(Note: The SQL file content in `database/schema.sql` and `database/seed.sql` is currently marked as **Pending Implementation** by Developer 3 under Phase 2 of the roadmap. Once authored by Developer 3, execute them as follows):*
   ```bash
   # Import 8 tables, constraints, and indexes
   mysql -u your_mysql_username -p fitsphere < database/schema.sql

   # Import seed data (default admin, sample trainers, plans, classes)
   mysql -u your_mysql_username -p fitsphere < database/seed.sql
   ```

---

## 9. Running the Application

### 9.1 Running the React Frontend

The frontend is served via Vite on port `3000`:

```bash
cd frontend
npm run dev
```

- **Local Access URL:** [http://localhost:3000](http://localhost:3000)
- **Production Build:**
  ```bash
  npm run build
  ```
  Generates production-ready assets in `frontend/dist/`.
- **Preview Production Build:**
  ```bash
  npm run preview
  ```

### 9.2 Running the Java Servlet Backend

1. **Build the WAR package using Maven:**
   ```bash
   cd backend
   mvn clean package
   ```
   This generates the deployment package: `backend/target/fitsphere.war`.

2. **Deploy to Apache Tomcat 10.1:**
   - Copy `backend/target/fitsphere.war` to your Tomcat installation directory:
     ```text
     $CATALINA_HOME/webapps/fitsphere.war
     ```
   - Start Apache Tomcat:
     - **Windows:** `$CATALINA_HOME\bin\startup.bat`
     - **Linux/macOS:** `$CATALINA_HOME/bin/startup.sh`

3. **Verify Backend Health:**
   Once Tomcat deploys the archive, the backend API will be reachable at:
   ```text
   http://localhost:8080/fitsphere/api
   ```

> *Setup Note:* Backend Java classes (servlets, filters, DAOs) are currently pending implementation under Phases 2–6. The packaging and deployment commands above represent the verified target workflow.

---

## 10. Team Responsibilities & Ownership

FitSphere divides responsibilities according to a **Role-Based Full-Stack Ownership** model:

| Developer | Assigned Role | Frontend Scope | Backend & Infrastructure Scope |
|---|---|---|---|
| **Developer 1** | **Visitor / Public** | Public homepage, facilities showcase, trainer catalog, plan catalog, public schedule, login UI. | Public read endpoints (`/trainers`, `/plans`, `/classes`), public data filtering. |
| **Developer 2** | **Administrator** | Admin dashboard, unified member creation form, member/trainer/plan CRUD, subscription renewal, payment audit viewer, class management. | Admin endpoints (`/users`, `/trainers`, `/plans`, `/subscriptions`, `/payments`, `/classes`), atomic member creation transaction. |
| **Developer 3** | **Member & Database** | Member dashboard, profile editor, password management, class booking grid, booking history & cancellation. | **Database Owner:** `schema.sql`, `seed.sql`, constraints, indexes, connection pool.<br>**Member Backend:** Member endpoints (`/users/profile`, `/users/password`, `/bookings`, `/classes`), class row-locking transaction. |
| **Shared** | **Core Infrastructure** | Shared layout components, `AuthContext`, base API client (`api.js`), route guards. | Database connection pool (`DatabaseConnection`), base models, `BaseServlet`, session `AuthFilter`, `AuthServlet`. |

---

## 11. Git Collaboration Workflow

The team follows a structured Git branching strategy documented in [`docs/DEVELOPMENT_WORKFLOW.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/DEVELOPMENT_WORKFLOW.md):

```text
main (Production/Stable)
  ▲
  │ (Release PRs only)
development (Integration Branch)
  ▲
  ├── feature/visitor-homepage (Developer 1)
  ├── feature/admin-member-management (Developer 2)
  └── feature/member-booking-engine (Developer 3)
```

1. **Branch Protection:** Never commit directly to `main` or `development`.
2. **Feature Branching:** Always branch off an updated `development`:
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   ```
3. **Commit Standards:** Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
4. **Pull Requests:** Open PRs targeting `development`. Each PR requires at least one peer code review approval and passing builds prior to merge.

---

## 12. Documentation Directory

For complete system specifications, refer to the documents in [`docs/`](file:///c:/Users/ASUS/Desktop/gym_management/docs/):

- [`PROJECT_CONTEXT.md`](file:///c:/Users/ASUS/Desktop/gym_management/PROJECT_CONTEXT.md): Project overview, agreed architectural decisions, and current repository status.
- [`AGENTS.md`](file:///c:/Users/ASUS/Desktop/gym_management/AGENTS.md): Strict technical boundaries and guidelines for developers and AI agents.
- [`docs/PROJECT_REQUIREMENTS.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/PROJECT_REQUIREMENTS.md): Comprehensive functional requirements, role use cases, and business rules.
- [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/DATABASE_SCHEMA.md): Complete data dictionary for all 8 tables, constraints, indexes, and locking behavior.
- [`docs/ARCHITECTURE.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/ARCHITECTURE.md): System architecture, transaction boundaries, session auth model, and state management.
- [`docs/API_CONTRACT.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/API_CONTRACT.md): Exhaustive HTTP endpoints, request/response JSON schemas, and error codes.
- [`docs/DEVELOPMENT_WORKFLOW.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/DEVELOPMENT_WORKFLOW.md): Step-by-step Git workflow, PR rules, review checklist, and conflict resolution.
- [`docs/TASKS.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/TASKS.md): 9-phase development task breakdown, dependency graph, and completion criteria.
