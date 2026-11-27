# FitSphere — Development Workflow & Git Guidelines

## 1. Overview and Purpose

This document establishes the collaboration practices, Git branching model, commit conventions, and quality standards for the **FitSphere** development team.

FitSphere is developed by a team of three university students over an intensive ~14-day schedule. Because all three developers work concurrently in a single monorepo containing both the React frontend and Java Servlet backend, adhering to this workflow is essential to avoid code collisions, merge conflicts, and integration delays.

---

## 2. Team Structure & Role-Based Full-Stack Ownership

The team follows a **Role-Based Full-Stack Ownership** model. Each developer is the end-to-end owner of both the user interface and backend logic for their assigned domain.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        FitSphere Monorepo                              │
├──────────────────────┬──────────────────────────┬──────────────────────┤
│     Developer 1      │       Developer 2        │     Developer 3      │
│  Visitor Experience  │      Administrator       │   Member Experience  │
├──────────────────────┼──────────────────────────┼──────────────────────┤
│ • Public Homepage    │ • Admin Dashboard        │ • Member Dashboard   │
│ • Facilities/Services│ • Member Management      │ • Profile Management │
│ • Trainers Catalog   │ • Trainer Management     │ • Subscription View  │
│ • Plans Catalog      │ • Plan Management        │ • Class Schedules    │
│ • Public Classes     │ • Subscription Tracking  │ • Booking Workflow   │
│ • Login Interface    │ • Class Management       │ • Booking History    │
│ • Visitor Endpoints  │ • Booking Oversight      │ • Cancellation       │
│                      │ • Admin Endpoints        │ • Member Endpoints   │
└──────────────────────┴──────────────────────────┴──────────────────────┘
```

### 2.1 Individual Ownership vs. Shared Responsibilities

| Responsibility Area | Individual Developer Ownership | Shared Team Responsibility |
|---|---|---|
| **Role Features** | Implements React pages, UI components, and API callers for assigned role. | None (owned exclusively by the assigned developer). |
| **Backend Servlets** | Implements role-specific servlet endpoints and controller logic. | Adherence to shared response conventions and error structures. |
| **Database Design & Setup** | **Developer 3:** Exclusive owner of MySQL database creation, `database/schema.sql`, `database/seed.sql`, constraints, indexes, and connection setup (`DB-01` to `DB-04`). | Developers 1 and 2 coordinate any query/schema needs with Developer 3; no independent schema modifications. |
| **Authentication & Security** | **Developer 1 (Lead):** Implements `PasswordUtil` & `AuthServlet`.<br>**Developer 2 (Lead):** Implements `AuthFilter` & `CorsFilter`. | **Shared:** Session attributes (`userId`, `role`), cookies, response envelopes, and mutual review. |
| **Shared Models & Utilities**| **Developer 3 (Lead):** Implements base POJO models (`BASE-01`), enums, `JsonUtil` & `DateUtil` (`BASE-02`), and DTOs (`BASE-03`).<br>**Developer 2 (Lead):** Implements validators & exceptions (`BASE-04`), and `BaseServlet` (`BASE-05`). | **Shared:** Modifying a shared model or base controller requires peer review and approval before merging. |
| **API Contract** | Follows the endpoints specified for their assigned role. | **Shared:** `docs/API_CONTRACT.md` must be agreed upon before any endpoint changes. |
| **Common UI Elements**| Uses components from `components/common/`. | **Shared:** Enhancements to common buttons, inputs, headers, or modal dialogs. |

---

## 3. Git Branching Strategy

The repository uses a simple, robust 3-tier branching model designed for a small team without the overhead of heavy branching frameworks like GitFlow.

```text
main           ──────────────────────────────────────● (v1.0 Milestone Release)
                                                    ▲
                                                    │ PR / Merge (Milestone)
development    ────●─────────●──────────────●───────●────────●
                    \       /              / \     /
     feature branches\     / feature/admin/   \   / feature/member-booking
                      ●───●                    ●─●
```

### 3.1 Branch Definitions

1. **`main` (Production / Stable Version):**
   - Represents stable, fully integrated, and tested code.
   - Developers **never push directly to `main`**.
   - Updated only from `development` when milestones are reached and verified.

2. **`development` (Shared Integration Branch):**
   - The central active branch where all completed features are merged.
   - All feature branches branch off `development` and merge back into `development`.
   - Always kept in a buildable, compiling state.

3. **Feature Branches (`feature/*`, `fix/*`, `docs/*`):**
   - Created by individual developers for specific tasks.
   - Isolated from other developers' work until ready for integration.

### 3.2 Branch Naming Conventions

Branch names should be descriptive, lowercase, and use hyphens:

| Type | Format | Example |
|---|---|---|
| New Feature | `feature/<role-or-domain>-<feature-name>` | `feature/visitor-trainers-page` |
| | | `feature/admin-member-crud` |
| | | `feature/member-booking-history` |
| Bug Fix | `fix/<bug-description>` | `fix/booking-capacity-lock` |
| | | `fix/cors-session-cookie` |
| Documentation | `docs/<document-name>` | `docs/update-api-contract` |
| | | `docs/task-breakdown` |
| Refactoring | `refactor/<target-module>` | `refactor/user-dao-cleanup` |

---

## 4. Complete Step-by-Step Development Lifecycle

Follow these 12 steps for every task:

### Step 1: Clone the Repository (Initial Setup Only)
```bash
git clone <repository-url>
cd gym_management
```

### Step 2: Fetch and Update Local Branches
Always fetch remote metadata before starting work:
```bash
git fetch origin
```

### Step 3: Switch to the `development` Branch
```bash
git checkout development
```

### Step 4: Pull the Latest Changes
Ensure your local `development` branch has the latest commits from your teammates:
```bash
git pull origin development
```

### Step 5: Create and Switch to a New Feature Branch
Branch directly from the updated `development` branch:
```bash
git checkout -b feature/admin-member-crud
```

### Step 6: Implement and Test Locally
- Write your frontend components and/or Java backend classes.
- Verify the frontend builds cleanly:
  ```bash
  cd frontend
  npm run build
  ```
- Test functionality in your browser against local Tomcat and MySQL.

### Step 7: Stage and Commit Changes
Follow the commit conventions defined in Section 5:
```bash
git status
git add frontend/src/features/admin/pages/MembersPage.jsx
git add backend/src/main/java/com/fitsphere/servlet/UserServlet.java
git commit -m "feat(admin): implement member management CRUD view and servlet handler"
```

### Step 8: Push the Feature Branch to GitHub
```bash
git push -u origin feature/admin-member-crud
```

### Step 9: Open a Pull Request (PR)
- Go to GitHub and open a Pull Request.
- **Base branch:** `development` (⚠️ **Never target `main` directly**).
- **Compare branch:** your feature branch (e.g. `feature/admin-member-crud`).
- Provide a clear PR title and summary of changes.

### Step 10: Review and Address Feedback
- Notify teammates via chat or discussion.
- If changes or fixes are requested, make commits locally and push them to the same branch. The PR updates automatically.

### Step 11: Merge into `development`
- Once verified and approved, merge the PR into `development`.
- Delete the remote feature branch on GitHub after merging to keep the repository clean.

### Step 12: Update Local `development` for the Next Task
Switch back to `development`, pull the newly merged changes, and delete the local feature branch:
```bash
git checkout development
git pull origin development
git branch -d feature/admin-member-crud
```

---

## 5. Commit Conventions

Commits must be concise, descriptive, and follow the standard **Conventional Commits** format:

```text
<type>(<scope>): <short imperative description>
```

### 5.1 Commit Types

- **`feat`**: A new user-facing feature or API endpoint.
- **`fix`**: A bug fix or error correction.
- **`docs`**: Documentation updates (markdown files in `docs/` or README).
- **`refactor`**: Code changes that neither fix a bug nor add a feature (e.g. restructuring a component).
- **`test`**: Adding or updating tests.
- **`chore`**: Maintenance, build tool adjustments, or `.gitignore` changes.

### 5.2 Realistic FitSphere Examples

```bash
# Good examples:
feat(visitor): add public trainers catalog card grid
feat(admin): implement unified 3-in-1 member creation form
feat(member): add class booking button with active subscription check
fix(booking): acquire class row lock before capacity verification
fix(auth): include session credentials in base api client
docs(api): update booking endpoint response codes
refactor(dao): use try-with-resources in SubscriptionDAO
chore(deps): update vite to latest patch version

# Bad examples (DO NOT USE):
git commit -m "fixes"
git commit -m "update code"
git commit -m "asdf"
git commit -m "it works now"
```

---

## 6. Pull Request Rules & Quality Checklist

### 6.1 Core PR Rules

1. **Target `development` Only:** Feature PRs must always merge into `development`. Direct merges into `main` are reserved for verified milestone releases.
2. **Self-Review First:** Review your own diff on GitHub before requesting review. Ensure no stray debug lines (`console.log`, `System.out.println`) or commented-out code remain.
3. **No Breaking API Changes:** Never merge changes that alter an endpoint's request or response format unless agreed upon in `docs/API_CONTRACT.md`.
4. **Communicate Shared File Changes:** If your PR touches core infrastructure (`api.js`, `web.xml`, `AuthFilter`, or `pom.xml`), explicitly tag your teammates.

### 6.2 Pre-PR Quality Checklist

Before opening a PR, the author must verify every item below:

- [ ] **Frontend Build Check:** `npm run build` inside `frontend/` succeeds with 0 errors.
- [ ] **Backend Compilation Check:** Java classes compile cleanly with no syntax errors.
- [ ] **API Contract Conformance:** Endpoints match the methods, URLs, camelCase keys, and HTTP status codes defined in `docs/API_CONTRACT.md`.
- [ ] **Backend Authorization Enforced:** Role checks (`ADMIN` or `MEMBER`) are validated on the server side in the servlet/filter, not just in React.
- [ ] **No Credentials Committed:** No passwords, database credentials, or `.env` files are tracked. `.env.example` remains intact.
- [ ] **Clean Git Status:** No temporary files, IDE folders (`.idea/`, `.vscode/`), `target/`, or `node_modules/` are included.

---

## 7. Frontend & Backend Integration Guidelines

Because developers own both frontend and backend for their assigned role, integration follows these strict rules:

### 7.1 API-Contract-First Development
1. Always consult [`docs/API_CONTRACT.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/API_CONTRACT.md) before writing either the React service or the Java Servlet.
2. If an endpoint requires an extra parameter or property not currently documented, **propose the change to the team first** and update `API_CONTRACT.md` before coding.
3. Never invent new URLs, HTTP verbs, or JSON key names on the fly.

### 7.2 Session Cookie & CORS Handling
All HTTP communication between React (running on `http://localhost:3000`) and Tomcat (running on `http://localhost:8080`) must preserve session cookies:
- **Frontend:** Always use `apiRequest` from `src/services/api.js`, which enforces `credentials: 'include'`.
- **Backend:** Ensure `CorsFilter` sets:
  ```text
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Credentials: true
  ```

### 7.3 Database Coordination
- All 8 database tables are defined in [`docs/DATABASE_SCHEMA.md`](file:///c:/Users/ASUS/Desktop/gym_management/docs/DATABASE_SCHEMA.md).
- Developers must never alter table structures or column names in their DAOs without team consensus and a synchronized update to `docs/DATABASE_SCHEMA.md` and `database/schema.sql`.

---

## 8. Shared-File Coordination & Collision Prevention

To avoid merge conflicts, team members must coordinate when modifying shared files:

### 8.1 Shared Files Inventory

| Shared File / Directory | Purpose | Coordination Rule |
|---|---|---|
| `docs/API_CONTRACT.md` | Single source of truth for endpoints | Agreement required before altering any endpoint. |
| `docs/DATABASE_SCHEMA.md` | Relational database schema | Agreement required before modifying tables or columns. |
| `frontend/src/services/api.js` | Base fetch client | Shared configuration. Touch only with mutual consent. |
| `frontend/src/context/AuthContext.jsx` | Global authentication state | Touch only when modifying session auth logic. |
| `frontend/src/routes/ProtectedRoute.jsx` | Route guard component | Shared navigation security. |
| `frontend/src/components/common/` | Shared UI components | Create reusable elements; do not alter existing props without checking callers. |
| `backend/src/main/java/com/fitsphere/config/` | Database configuration | Central connection pool / JDBC setup. |
| `backend/src/main/java/com/fitsphere/filter/` | `AuthFilter` and `CorsFilter` | Security filters affecting all requests. |
| `backend/src/main/java/com/fitsphere/model/` | Entity POJOs and Enums (`User`, `AuditLog`, etc.) | Shared data models. Do not alter fields arbitrarily. |
| `backend/src/main/webapp/WEB-INF/web.xml` | Servlet mappings & configuration | Notify teammates when registering a new servlet mapping. |

### 8.2 Protocol for Shared File Edits
1. Announce in team chat: *"I need to register `PaymentServlet` in `web.xml` and add a helper method in `api.js`."*
2. Ensure you have the absolute latest `development` branch pulled before editing.
3. Make the minimal necessary change in an isolated commit.
4. Promptly submit the PR so teammates can pull the update before conflicts occur.

---

## 9. Resolving Merge Conflicts

If another developer merges a feature into `development` while you are working on your feature branch, a merge conflict may occur when you attempt to merge.

### Conflict Resolution Procedure

```bash
# 1. Commit or stash all your current local changes
git status
git commit -m "feat(member): checkpoint before rebase"

# 2. Fetch the latest changes from the remote repository
git fetch origin

# 3. Rebase or merge development into your feature branch
git checkout feature/your-feature
git merge origin/development
```

If Git reports conflicting files:
1. Open the conflicted files in VS Code / your editor.
2. Review the conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>> origin/development`).
3. Communicate with the teammate who wrote the conflicting code to decide which lines to keep.
4. **Never blindly accept "incoming" or "current" changes** if it deletes teammate logic.
5. Save the file and mark as resolved:
   ```bash
   git add <resolved-file>
   git commit -m "chore: resolve merge conflict with development"
   ```
6. **Verify both builds immediately**:
   ```bash
   cd frontend && npm run build
   ```
7. Push the updated feature branch back to GitHub:
   ```bash
   git push origin feature/your-feature
   ```

---

## 10. Milestone Releases (`development` → `main`)

`main` is updated only at major project milestones (e.g. End of Week 1, and Final Capstone Submission).

### Milestone Release Procedure
1. Verify that all planned features for the milestone are merged into `development`.
2. Perform an end-to-end integration test across all three user roles:
   - Visitor: browsing homepage, trainers, plans, public classes.
   - Admin: creating member with subscription & payment, class CRUD, booking oversight.
   - Member: logging in, booking upcoming classes, viewing history, cancelling.
3. Once all manual and automated checks pass, open a PR from `development` to `main`.
4. Merge `development` into `main`.
5. Tag the release on `main`:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.0.0 -m "Release v1.0.0: Full functional integration"
   git push origin v1.0.0
   ```

---

## 11. Quick Git Command Cheat Sheet

```bash
# Start a new task
git checkout development
git pull origin development
git checkout -b feature/my-new-feature

# Check current status and staged files
git status
git diff

# Stage and commit
git add <files>
git commit -m "feat(<scope>): <description>"

# Push to GitHub
git push -u origin feature/my-new-feature

# Pull latest updates into your active branch
git pull origin development

# Discard uncommitted local changes on a file
git checkout -- <file>
```
