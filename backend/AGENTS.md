# Backend Agent Guidelines — FitSphere

These guidelines apply to all AI agents and developers working on the Java backend (`backend/`).

---

## Architecture & Technology Stack

- **Platform:** Java 17, Apache Tomcat 10.1
- **API Specification:** Jakarta Servlet 6.0 (`jakarta.servlet.*` imports only, NO `javax.servlet.*`)
- **Persistence:** JDBC with `PreparedStatement`, MySQL Connector/J, InnoDB transactions
- **Data Serialization:** Google Gson for JSON parsing and serialization
- **Security:** jBCrypt (`org.mindrot.jbcrypt.BCrypt`) for password hashing
- **Session Management:** Standard Jakarta HTTP sessions (`HttpSession`) with role-based attributes
- **Build System:** Apache Maven (Packaging: `war`)

---

## Architectural Rules

1. **Layered Separation of Concerns:**
   - `model/`: Plain Java Objects (POJOs) representing database entities and type-safe enums (`com.fitsphere.model.enums`).
   - `dto/`: Request and Response DTOs decoupling external API contracts from internal database entities.
   - `validator/`: Request payload validation ensuring data integrity before service execution.
   - `exception/`: Typed `AppException` hierarchy mapping directly to HTTP status codes and contract error codes.
   - `service/`: Domain business logic, transaction boundaries (`connection.setAutoCommit(false)`), and pessimistic row locking (`SELECT ... FOR UPDATE`).
   - `dao/`: Pure JDBC Data Access Objects executing parameterized SQL via `PreparedStatement`. Accepts connection from caller or connection pool.
   - `servlet/`: Thin HTTP controllers extending `BaseServlet`, extracting DTOs, delegating to Services, and writing JSON responses.
   - `config/`: Database connection management, environment variable loading (`IllegalStateException` on missing vars).
   - `filter/`: Cross-cutting HTTP filters for CORS, session validation, and role authorization.
   - `util/`: Shared helper utilities (`PasswordUtil`, `JsonUtil`, `DateUtil`, `ServletUtil`).

2. **Database & Connection Handling:**
   - Always use `PreparedStatement` with parameterized placeholders (`?`) to prevent SQL injection.
   - Always properly close database resources (`Connection`, `PreparedStatement`, `ResultSet`) using try-with-resources.
   - Use transactions (`connection.setAutoCommit(false)`, `commit()`, `rollback()`) when coordinating multi-step operations such as booking capacity checks.
   - Never hardcode credentials. Load DB connection settings from environment variables (`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).

3. **HTTP & API Conventions:**
   - Return standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `500 Internal Server Error`).
   - Adhere strictly to the JSON formats defined in `docs/API_CONTRACT.md`:
     - Success responses return descriptive entity/message payloads directly (e.g., `{ "message": "...", "user": { ... } }` or raw JSON arrays for list queries). Do not wrap in `{ "success": boolean, "data": ... }`.
     - Error responses must strictly use the standard error envelope: `{ "error": "ERROR_CODE", "message": "Human-readable explanation" }`.
   - Set `Content-Type: application/json; charset=UTF-8` on all JSON responses.

4. **Security & Authorization:**
   - Passwords must be hashed with BCrypt before persistence. Never store or log raw passwords.
   - Never trust frontend role indicators. Always validate user identity and role from the server-side `HttpSession`.
   - Protect administrative endpoints against unauthorized visitor or member requests.

5. **Shared Code & Team Ownership:**
   - Shared entities (`User`, `Trainer`, `MembershipPlan`, `Subscription`, `GymClass`, `Booking`, `Payment`, `AuditLog`) and their base DAOs are shared across roles.
   - Avoid duplicating entity classes or authentication handlers per role.
