# Root Agent Guidelines — FitSphere

These guidelines apply to all AI agents and developers working across the FitSphere repository.

---

## AI Agent Context Awareness

1. **Central Context Reference:** Always read `PROJECT_CONTEXT.md` before analyzing or implementing project-wide changes.
2. **Feature-Specific Documentation:** Read the relevant detailed documentation in `docs/` before modifying a specific feature.
3. **Approved Source of Truth:** Treat approved documentation as the absolute source of truth.
4. **Identify Gaps Proactively:** If documentation is missing, contradictory, or incomplete, identify and report the issue instead of inventing requirements.
5. **Keep Documentation Synchronized:** After implementing an approved change, update the relevant documentation if necessary.
6. **Verify Current Status:** Check the current project status before assuming a feature is implemented or pending.

---

## General Principles

1. **Read Before Acting:** Always read the `README.md`, `PROJECT_CONTEXT.md`, and relevant documentation files in `docs/` before implementing any feature or modifying existing code.
2. **Respect Established Architecture:** Adhere strictly to the decoupled React frontend and Jakarta Servlet backend architecture. Do not alter architectural boundaries without explicit approval.
3. **Approved Technology Stack Only:**
   - **Frontend:** React.js (JavaScript, not TypeScript), Vite, React Router, CSS, Fetch API.
   - **Backend:** Java 17, Jakarta Servlets (`jakarta.servlet.*`), JDBC, MySQL, Apache Tomcat 10.1, Maven, Gson, BCrypt.
   - **Strictly Prohibited:** Spring Boot, JSP, Node.js backend, PostgreSQL, MongoDB, TypeScript, or unnecessary third-party libraries.
4. **No Invented Endpoints or Tables:** Never introduce database tables, columns, or API endpoints that have not been approved and documented in `docs/DATABASE_SCHEMA.md` or `docs/API_CONTRACT.md`.
5. **Inspect Existing Files:** Always check and inspect existing code and file structures before creating or modifying files.
6. **Avoid Unnecessary Dependencies & Abstractions:** Keep solutions simple, clean, and maintainable. Avoid premature optimization, complex design patterns, or extra packages.
7. **Never Overwrite Existing Work:** Preserve work created by teammates or other sessions unless explicitly instructed to refactor.
8. **Strict Frontend/Backend Separation:** The React frontend handles presentation and user interaction; the Java backend enforces all business logic, validation, and data persistence. Never trust frontend validation alone.
9. **Security & Credentials:** Never hardcode database credentials, passwords, or secrets in code. Never commit real `.env` files.
10. **Explain Changes:** At the end of every task, provide a clear explanation of changes made and list all created or modified files.
11. **Strict Scope Control:** Do not implement features or business logic outside the approved scope of the current task.

---

## Team Collaboration & Role Ownership

The team follows a **Role-Based Full-Stack Ownership** model across three roles:
- **Member 1:** Visitor / Public Experience (Frontend & Backend)
- **Member 2:** Administrator (Frontend & Backend)
- **Member 3:** Member (Frontend & Backend)

### Rules for Shared Files & Features
- Core infrastructure (database schema, authentication filter, base API client, common models/DAOs) is shared.
- Any change to shared functionality, database tables, or API contracts must be coordinated and agreed upon before implementation.
- Avoid duplicate implementations of shared components, utilities, or database entities.
