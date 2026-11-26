# Frontend Agent Guidelines — FitSphere

These guidelines apply to all AI agents and developers working on the React frontend (`frontend/`).

---

## Architecture & Technology Stack

- **Framework:** React.js (JavaScript, not TypeScript)
- **Tooling:** Vite, ECMAScript modules (`type: "module"`)
- **Routing:** React Router v6 (`react-router-dom`)
- **Styling:** Modular CSS / modern CSS (scoped or standard CSS)
- **HTTP Client:** Native Fetch API with centralized wrapper in `src/services/api.js`
- **State Management:** React Context API (`AuthContext`) for authentication; local component state for UI state

---

## Architectural Rules

1. **Functional Components & Hooks:**
   - Use functional components exclusively with modern React hooks (`useState`, `useEffect`, `useContext`, `useCallback`, `useMemo`).
   - Create custom hooks in `src/hooks/` for shared, stateful logic.

2. **Role-Specific Organization:**
   - Organize features strictly under `src/features/<role>/`:
     - `visitor/`: Public landing page, gym services, trainer listing, pricing plans, public class list, login page.
     - `admin/`: Admin dashboard, member/trainer/plan/subscription/class CRUD screens.
     - `member/`: Member dashboard, profile, subscription status, booking and cancellation views.
   - Shared reusable UI components belong in `src/components/common/`.
   - Role-specific UI components belong in `src/components/<role>/` or `src/features/<role>/components/`.

3. **Centralized API Communication:**
   - Never use direct `fetch` inside UI components. All HTTP calls must flow through dedicated service modules in `src/services/`.
   - Use `src/services/api.js` as the single base client.
   - All session-authenticated requests MUST include `credentials: "include"` to pass HTTP session cookies.

4. **Authentication & Protected Routes:**
   - Global authentication state is managed in `src/context/AuthContext.jsx`.
   - Enforce client-side route access using `src/routes/ProtectedRoute.jsx`.
   - Never assume frontend route protection is sufficient for security; backend authorization is mandatory.

5. **Naming Conventions:**
   - Components & Contexts: PascalCase (e.g., `AuthContext.jsx`, `ProtectedRoute.jsx`, `Navbar.jsx`).
   - Services, hooks, utilities: camelCase (e.g., `api.js`, `authService.js`, `useAuth.js`).
   - CSS files: match component name or page name.

6. **Avoid Duplicate Implementations:**
   - Share common UI elements (buttons, modals, tables, form inputs, loaders) from `src/components/common/`.
   - Do not duplicate services or authentication logic across roles.
