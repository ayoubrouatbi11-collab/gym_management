# FitSphere — API Contract

## 1. Purpose

This document defines the formal communication contract between the FitSphere React frontend and the Java Servlet backend.

It specifies:
- API conventions, serialization standards, and base configurations.
- Authentication and authorization mechanics.
- Complete endpoint listings with HTTP methods, paths, and role requirements.
- Request payloads and response structures.
- Standardized error codes and HTTP status mappings.
- Validation rules and business logic constraints.

All team members must follow this contract when implementing frontend services and backend servlets.

---

## 2. General API Conventions

### 2.1 Base URL

Development backend:

```text
http://localhost:8080/fitsphere/api
```

All endpoints defined in this document are relative to this base URL (e.g., `/auth/login` maps to `http://localhost:8080/fitsphere/api/auth/login`).

### 2.2 Data Format & Naming Conventions

- **Protocol:** HTTP/1.1 (JSON over HTTP).
- **Request Headers:**
  - `Content-Type: application/json; charset=UTF-8` on requests with JSON bodies.
  - `Accept: application/json`.
- **Response Headers:**
  - `Content-Type: application/json; charset=UTF-8` on all JSON responses.
- **JSON Key Naming (camelCase):**
  - All JSON payload properties use **`camelCase`** (e.g., `fullName`, `startDate`, `durationMonths`, `classDate`, `startTime`, `accountStatus`), matching Java POJO conventions and standard Google Gson serialization.
  - Database column mapping (snake_case to camelCase):
    | Database Column | Java / JSON Property |
    |---|---|
    | `full_name` | `fullName` |
    | `account_status` | `accountStatus` |
    | `duration_months` | `durationMonths` |
    | `is_active` | `isActive` |
    | `user_id` | `userId` |
    | `plan_id` | `planId` |
    | `start_date` | `startDate` |
    | `end_date` | `endDate` |
    | `trainer_id` | `trainerId` |
    | `class_date` | `classDate` |
    | `start_time` | `startTime` |
    | `end_time` | `endTime` |
    | `class_id` | `classId` |
    | `booking_date` | `bookingDate` |
    | `subscription_id` | `subscriptionId` |
    | `payment_date` | `paymentDate` |
    | `payment_status` | `paymentStatus` |
- **Data Formats:**
  - Dates: `YYYY-MM-DD` (e.g. `"2026-11-26"`).
  - Times: `HH:mm:ss` (e.g. `"10:00:00"`).
  - Timestamps: ISO 8601 string (e.g. `"2026-11-26T10:30:00"`).
  - Currency / Prices: Decimal numbers with two fractional digits (e.g. `80.00`).

### 2.3 Authentication & Session Handling

FitSphere uses **HTTP session-based authentication** (`jakarta.servlet.http.HttpSession`):
- A successful login creates an authenticated session on the backend.
- The session identifier (`JSESSIONID`) is automatically maintained by the browser via an `HttpOnly` cookie.
- The React frontend must include session credentials on all requests by configuring the Fetch API with:
  ```javascript
  credentials: "include"
  ```
- Logout invalidates the server-side session.
- The backend verifies authentication and user role for every protected endpoint.
- **No JWT tokens** are used or required.

### 2.4 HTTP Status Codes

| Status | Meaning | Usage in FitSphere |
|---|---|---|
| **200 OK** | Request succeeded | Standard successful retrieval or update. |
| **201 Created** | Resource created | Successful entity creation (user, subscription, class, booking, payment). |
| **204 No Content** | Success with empty body | Successful logout or action with no return payload. |
| **400 Bad Request** | Validation error | Malformed JSON, missing required fields, or invalid formats. |
| **401 Unauthorized** | Unauthenticated | User is not logged in or session has expired. |
| **403 Forbidden** | Authorization failure | User does not have the required role, or member lacks active subscription. |
| **404 Not Found** | Resource missing | Requested ID does not exist. |
| **409 Conflict** | Business conflict | Duplicate email, duplicate active booking, full class, or foreign key block. |
| **500 Internal Error** | Server failure | Uncaught exception or database connection failure. |

### 2.5 Cross-Origin Resource Sharing (CORS) Configuration

The Java Servlet backend enforces CORS policies via `CorsFilter` to permit communication with the React frontend running on `http://localhost:3000`:
- **Allowed Origin:** `http://localhost:3000` (Wildcard `*` is strictly disallowed when credentials are included).
- **Allowed Methods:** `GET, POST, PUT, DELETE, OPTIONS`.
- **Allowed Headers:** `Content-Type, Accept`.
- **Allow Credentials:** `Access-Control-Allow-Credentials: true` (mandatory for `JSESSIONID` session cookie transport).
- **Preflight Handling:** Any HTTP `OPTIONS` preflight request is intercepted by `CorsFilter` and immediately answered with `200 OK` (or `204 No Content`), echoing these headers with an empty response body.

---

## 3. Authentication Endpoints

Handled by: `AuthServlet` (`/api/auth/*`)

### 3.1 Login

**POST** `/auth/login`  
**Access:** Public (Unauthenticated)

**Request Body:**
```json
{
  "email": "member@example.com",
  "password": "password123"
}
```

**Success Response — 200 OK:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 15,
    "fullName": "Ahmed Ali",
    "email": "member@example.com",
    "phone": "12345678",
    "role": "MEMBER",
    "accountStatus": "ACTIVE"
  }
}
```
*Note:* The backend establishes an `HttpSession` with user ID and role attributes. Password hashes are never returned. Returns the full 6-field user object to maintain state consistency with `/auth/me`.

**Error Responses:**
- `401 Unauthorized` (`INVALID_CREDENTIALS`): Incorrect email or password, or account status is `INACTIVE`.
- `400 Bad Request` (`VALIDATION_ERROR`): Missing email or password.

---

### 3.2 Get Current Session User

**GET** `/auth/me`  
**Access:** Authenticated (`MEMBER` or `ADMIN`)

Used by both Member and Administrator dashboards upon page load or refresh to retrieve authenticated session user details.

**Success Response — 200 OK:**
```json
{
  "id": 15,
  "fullName": "Ahmed Ali",
  "email": "member@example.com",
  "phone": "12345678",
  "role": "MEMBER",
  "accountStatus": "ACTIVE"
}
```

*Note on Admin and Member Authorization:*
- `/auth/me` is universally accessible to any authenticated session (both `MEMBER` and `ADMIN`).
- The administrator dashboard uses `/auth/me` to identify the logged-in administrator.

**Error Responses:**
- `401 Unauthorized` (`AUTHENTICATION_REQUIRED`): Session missing or expired.

---

### 3.3 Logout

**POST** `/auth/logout`  
**Access:** Authenticated (`MEMBER` or `ADMIN`)

**Success Response — 204 No Content**  
The backend invalidates the session and expires the cookie.

---

## 4. User and Profile Endpoints

Handled by: `UserServlet` (`/api/users/*`)

### 4.1 Get Member Profile

**GET** `/users/me`  
**Access:** Member only (`MEMBER`)

Dedicated member self-service profile endpoint. Administrator accounts do not have member profiles and must use `GET /auth/me` for session identity. If called by an `ADMIN`, the backend returns `403 Forbidden` (`ACCESS_DENIED`).

**Success Response — 200 OK:**
```json
{
  "id": 15,
  "fullName": "Ahmed Ali",
  "email": "member@example.com",
  "phone": "12345678",
  "role": "MEMBER",
  "accountStatus": "ACTIVE"
}
```

---

### 4.2 Update Member Profile (Self-Service)

**PUT** `/users/me`  
**Access:** Member only (`MEMBER`)

Members can update only their permitted personal fields: `fullName` and `phone`.

**Request Body:**
```json
{
  "fullName": "Ahmed Ben Ali",
  "phone": "98765432"
}
```

*Rules:*
- Email, role, and account status cannot be modified by the member. If passed in the payload, they are ignored.

**Success Response — 200 OK:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 15,
    "fullName": "Ahmed Ben Ali",
    "email": "member@example.com",
    "phone": "98765432",
    "role": "MEMBER",
    "accountStatus": "ACTIVE"
  }
}
```

---

### 4.3 Change Password (Self-Service)

**PUT** `/users/me/password`  
**Access:** Member only (`MEMBER`)

Dedicated self-service operation for changing the account password.

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Backend Enforcement:**
1. Verifies `currentPassword` against stored BCrypt hash.
2. Validates `newPassword`: Must be at least 6 characters in length and cannot contain whitespace.
3. Hashes `newPassword` with BCrypt and updates database.
4. Never exposes password hashes in responses.

**Success Response — 200 OK:**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400 Bad Request` (`INVALID_CURRENT_PASSWORD`): Current password incorrect.
- `400 Bad Request` (`VALIDATION_ERROR`): New password does not meet requirements.

---

## 5. Administrative User Management Endpoints

Handled by: `UserServlet` (`/api/users/*`)  
**Access:** Administrator only (`ADMIN`)

### 5.1 Get All Users

**GET** `/users`  
**Optional Query Parameters:**
- `role`: Filter by role (`MEMBER`, `ADMIN`, or `ALL`). Default when omitted: returns `MEMBER` accounts. Passing `?role=ADMIN` returns administrators; `?role=ALL` returns all accounts.
- `status`: Filter by account status (`ACTIVE` or `INACTIVE`). Default when omitted: returns accounts of all statuses.

**Success Response — 200 OK:**
```json
[
  {
    "id": 15,
    "fullName": "Ahmed Ali",
    "email": "member@example.com",
    "phone": "12345678",
    "role": "MEMBER",
    "accountStatus": "ACTIVE",
    "createdAt": "2026-11-26T09:00:00"
  }
]
```

---

### 5.2 Get User by ID

**GET** `/users/{id}`

**Success Response — 200 OK:**
```json
{
  "id": 15,
  "fullName": "Ahmed Ali",
  "email": "member@example.com",
  "phone": "12345678",
  "role": "MEMBER",
  "accountStatus": "ACTIVE",
  "createdAt": "2026-11-26T09:00:00"
}
```

---

### 5.3 Unified Member Creation (3-in-1 Workflow)

**POST** `/users`

Used by the administrator when creating a member account after verifying physical in-person payment.

**Mandatory Rule:**
In accordance with project business rules, **the initial subscription and payment are strictly mandatory**. A member account cannot be created without an initial subscription. All 8 fields listed below are required. If any field is missing, the backend rejects the request with `400 Bad Request` (`VALIDATION_ERROR`).

**Request Body (All Fields Required):**
```json
{
  "fullName": "Ahmed Ali",
  "email": "ahmed@example.com",
  "phone": "12345678",
  "password": "initialPassword123",
  "planId": 1,
  "startDate": "2026-11-26",
  "amount": 80.00,
  "paymentDate": "2026-11-26"
}
```

**Backend Enforcement (Atomic Transaction):**
1. Validates all required fields are present and non-empty. Verifies password policy (minimum 6 characters, no whitespace).
2. Validates unique email across `users`.
3. Verifies that `planId` references an active membership plan (`is_active = TRUE`) and retrieves `durationMonths`.
4. Hashes password using BCrypt.
5. Inserts into `users` (`role = 'MEMBER'`, `account_status = 'ACTIVE'`).
6. Computes `endDate` from `startDate` using inclusive calendar range (`startDate.plusMonths(durationMonths).minusDays(1)`).
7. Inserts into `subscriptions` (`user_id`, `plan_id`, `start_date`, `end_date`, `status = 'ACTIVE'`).
8. Inserts into `payments` (`user_id`, `subscription_id`, `amount`, `payment_date`, `payment_status = 'PAID'`).
9. Commits the transaction atomically. If any step fails, rolls back completely.

**Success Response — 201 Created:**
```json
{
  "message": "Member created successfully with initial subscription and payment",
  "user": {
    "id": 15,
    "fullName": "Ahmed Ali",
    "email": "ahmed@example.com",
    "phone": "12345678",
    "role": "MEMBER",
    "accountStatus": "ACTIVE"
  },
  "subscription": {
    "id": 1,
    "planId": 1,
    "startDate": "2026-11-26",
    "endDate": "2026-12-25",
    "status": "ACTIVE"
  },
  "payment": {
    "id": 1,
    "amount": 80.00,
    "paymentDate": "2026-11-26",
    "paymentStatus": "PAID"
  }
}
```

**Error Responses:**
- `409 Conflict` (`EMAIL_ALREADY_EXISTS`): Email already registered.
- `400 Bad Request` (`VALIDATION_ERROR`): Missing required fields or negative amount.

---

### 5.4 Update User Administratively

**PUT** `/users/{id}`

Allows the administrator to update member information including email, full name, phone, and role.

**Request Body:**
```json
{
  "fullName": "Ahmed Ali",
  "email": "ahmed.new@example.com",
  "phone": "87654321"
}
```

**Success Response — 200 OK:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": 15,
    "fullName": "Ahmed Ali",
    "email": "ahmed.new@example.com",
    "phone": "87654321",
    "role": "MEMBER",
    "accountStatus": "ACTIVE"
  }
}
```

---

### 5.5 Update User Status (Activate / Deactivate)

**PUT** `/users/{id}/status`

**Request Body:**
```json
{
  "accountStatus": "INACTIVE"
}
```

**Success Response — 200 OK:**
```json
{
  "message": "User status updated to INACTIVE",
  "id": 15,
  "accountStatus": "INACTIVE"
}
```

---

### 5.6 Delete User (Soft Delete)

**DELETE** `/users/{id}`

**Behavior (Soft Delete Policy):**
- Performs a soft delete by setting `account_status = 'INACTIVE'`.
- Physical SQL `DELETE` is prohibited if the member has related records in `subscriptions`, `bookings`, or `payments`.
- Returns `200 OK` confirming deactivation.

**Success Response — 200 OK:**
```json
{
  "message": "Member account deactivated successfully (Soft Delete)",
  "id": 15,
  "accountStatus": "INACTIVE"
}
```

---

## 6. Trainer Endpoints

Handled by: `TrainerServlet` (`/api/trainers/*`)

### 6.1 Get Active Trainers (Public / Admin)

**GET** `/trainers`  
**Access:** Public (Unauthenticated) or Administrator (`ADMIN`)

**Query Parameters:**
- `all`: (Boolean, optional). When `true` and caller is authenticated as `ADMIN`, returns all trainers (both active and inactive) for management and reactivation. For public or unauthenticated requests, this parameter is ignored and only active trainers (`is_active = TRUE`) are returned.

**Success Response — 200 OK:**
```json
[
  {
    "id": 1,
    "fullName": "John Smith",
    "specialization": "Strength & Conditioning",
    "phone": "12345678",
    "email": "john@example.com",
    "isActive": true
  }
]
```

---

### 6.2 Get Trainer Details

**GET** `/trainers/{id}`  
**Access:** Public

---

### 6.3 Create Trainer

**POST** `/trainers`  
**Access:** Administrator only (`ADMIN`)

**Request Body:**
```json
{
  "fullName": "Sarah Connor",
  "specialization": "Pilates & Core",
  "phone": "22334455",
  "email": "sarah@example.com"
}
```

**Success Response — 201 Created:**
```json
{
  "message": "Trainer created successfully",
  "trainer": {
    "id": 2,
    "fullName": "Sarah Connor",
    "specialization": "Pilates & Core",
    "phone": "22334455",
    "email": "sarah@example.com",
    "isActive": true
  }
}
```

---

### 6.4 Update Trainer

**PUT** `/trainers/{id}`  
**Access:** Administrator only (`ADMIN`)

**Request Body:**
```json
{
  "fullName": "John Smith",
  "specialization": "Strength & Conditioning (Lead)",
  "phone": "12345678",
  "email": "john.smith@example.com"
}
```

**Success Response — 200 OK:**
```json
{
  "message": "Trainer updated successfully",
  "trainer": {
    "id": 1,
    "fullName": "John Smith",
    "specialization": "Strength & Conditioning (Lead)",
    "phone": "12345678",
    "email": "john.smith@example.com",
    "isActive": true
  }
}
```

---

### 6.5 Update Trainer Status (Activate / Deactivate)

**PUT** `/trainers/{id}/status`  
**Access:** Administrator only (`ADMIN`)

**Request Body:**
```json
{
  "isActive": false
}
```

---

### 6.6 Delete Trainer (Soft Delete)

**DELETE** `/trainers/{id}`  
**Access:** Administrator only (`ADMIN`)

**Behavior (Soft Delete Policy):**
- Sets `is_active = FALSE`.
- Physical SQL `DELETE` is prohibited if the trainer is referenced by existing gym classes.

**Success Response — 200 OK:**
```json
{
  "message": "Trainer deactivated successfully (Soft Delete)",
  "id": 1,
  "isActive": false
}
```

---

## 7. Membership Plan Endpoints

Handled by: `PlanServlet` (`/api/plans/*`)

### 7.1 Get Active Membership Plans (Public / Admin)

**GET** `/plans`  
**Access:** Public (Unauthenticated) or Administrator (`ADMIN`)

**Query Parameters:**
- `all`: (Boolean, optional). When `true` and caller is authenticated as `ADMIN`, returns all membership plans (both active and inactive) for administrative management and reactivation. For public or unauthenticated requests, only active plans (`is_active = TRUE`) are returned.

**Success Response — 200 OK:**
```json
[
  {
    "id": 1,
    "name": "Standard Monthly",
    "durationMonths": 1,
    "price": 80.00,
    "description": "Full gym access for 30 days",
    "isActive": true
  }
]
```

---

### 7.2 Get Plan Details

**GET** `/plans/{id}`  
**Access:** Public

---

### 7.3 Create Membership Plan

**POST** `/plans`  
**Access:** Administrator only (`ADMIN`)

**Request Body:**
```json
{
  "name": "Quarterly Plan",
  "durationMonths": 3,
  "price": 210.00,
  "description": "3-month membership with fitness assessment"
}
```

**Success Response — 201 Created:**
```json
{
  "message": "Plan created successfully",
  "plan": {
    "id": 2,
    "name": "Quarterly Plan",
    "durationMonths": 3,
    "price": 210.00,
    "description": "3-month membership with fitness assessment",
    "isActive": true
  }
}
```

---

### 7.4 Update Membership Plan

**PUT** `/plans/{id}`  
**Access:** Administrator only (`ADMIN`)

**Request Body:**
```json
{
  "name": "Standard Monthly Pro",
  "durationMonths": 1,
  "price": 85.00,
  "description": "Full gym access including locker facilities"
}
```

**Success Response — 200 OK:**
```json
{
  "message": "Plan updated successfully",
  "plan": {
    "id": 1,
    "name": "Standard Monthly Pro",
    "durationMonths": 1,
    "price": 85.00,
    "description": "Full gym access including locker facilities",
    "isActive": true
  }
}
```

---

### 7.5 Update Plan Status (Activate / Deactivate)

**PUT** `/plans/{id}/status`  
**Access:** Administrator only (`ADMIN`)

**Request Body:**
```json
{
  "isActive": false
}
```

---

### 7.6 Delete Membership Plan (Soft Delete)

**DELETE** `/plans/{id}`  
**Access:** Administrator only (`ADMIN`)

**Behavior (Soft Delete Policy):**
- Sets `is_active = FALSE`.
- Physical SQL `DELETE` is prohibited if referenced by historical subscriptions.

---

## 8. Subscription Endpoints

Handled by: `SubscriptionServlet` (`/api/subscriptions/*`)

### 8.1 Get My Subscriptions

**GET** `/subscriptions/my`  
**Access:** Member only (`MEMBER`)

Returns the authenticated member's complete subscription history.

**Success Response — 200 OK:**
```json
[
  {
    "id": 1,
    "planId": 1,
    "planName": "Standard Monthly",
    "startDate": "2026-11-01",
    "endDate": "2026-11-30",
    "status": "ACTIVE",
    "isCurrentlyValid": true,
    "createdAt": "2026-11-01T10:00:00"
  }
]
```

*Important Rule (Dynamic Validity):*
- `isCurrentlyValid` is computed dynamically:
  `status === 'ACTIVE' && CURRENT_DATE >= startDate && CURRENT_DATE <= endDate`.
- Even if stored `status` is `ACTIVE`, if the calendar date has passed `endDate`, `isCurrentlyValid` returns `false`.

---

### 8.2 Get All Subscriptions

**GET** `/subscriptions`  
**Access:** Administrator only (`ADMIN`)

Returns subscription records with member and plan names for administrative management.

**Success Response — 200 OK:**
```json
[
  {
    "id": 1,
    "userId": 15,
    "userName": "Ahmed Ali",
    "planId": 1,
    "planName": "Standard Monthly",
    "startDate": "2026-11-26",
    "endDate": "2026-12-25",
    "status": "ACTIVE",
    "isCurrentlyValid": true,
    "createdAt": "2026-11-26T09:00:00"
  }
]
```

---

### 8.3 Get Subscription Details

**GET** `/subscriptions/{id}`  
**Access:** Administrator (`ADMIN`) or owner (`MEMBER`)

**Backend Ownership Enforcement:**
- If the authenticated user has the `ADMIN` role, access is granted unconditionally.
- If the authenticated user has the `MEMBER` role, the backend verifies that `subscription.userId == session.user.id`. If mismatched, the request is rejected with `403 Forbidden` (`ACCESS_DENIED`).

---

### 8.4 Create / Renew Subscription

**POST** `/subscriptions`  
**Access:** Administrator only (`ADMIN`)

Used for **subscription renewals** on an existing member account.

**Request Body:**
```json
{
  "userId": 15,
  "planId": 1,
  "startDate": "2026-12-01",
  "amount": 80.00,
  "paymentDate": "2026-11-26"
}
```

**Backend Enforcement (Atomic Transaction):**
1. Verifies member exists and is active.
2. Verifies plan is active and fetches `durationMonths`.
3. Computes `endDate` from `startDate` using inclusive calendar range (`startDate.plusMonths(durationMonths).minusDays(1)`).
4. Inserts new `subscriptions` record (`user_id`, `plan_id`, `start_date`, `end_date`, `status = 'ACTIVE'`).
5. Inserts new `payments` record (`user_id`, `subscription_id`, `amount`, `payment_date`, `payment_status = 'PAID'`).
6. Preserves existing subscription history.
7. Commits transaction.

**Success Response — 201 Created:**
```json
{
  "message": "Subscription renewed successfully",
  "subscription": {
    "id": 2,
    "userId": 15,
    "planId": 1,
    "startDate": "2026-12-01",
    "endDate": "2026-12-31",
    "status": "ACTIVE"
  },
  "payment": {
    "id": 2,
    "amount": 80.00,
    "paymentDate": "2026-11-26",
    "paymentStatus": "PAID"
  }
}
```

---

### 8.5 Cancel Subscription

**PUT** `/subscriptions/{id}/cancel`  
**Access:** Administrator only (`ADMIN`)

Updates subscription status to `CANCELLED`.

---

## 9. Payment Management Endpoints

Handled by: `PaymentServlet` (`/api/payments/*`)  
**Access:** Administrator only (`ADMIN`)

All payments are received physically at the gym and recorded manually. FitSphere does not process online card payments.

**Payment Creation Policy:**
Payment records are created exclusively inside two atomic workflows:
1. **Initial Member Creation (`POST /users`):** Creates the member account, initial subscription, and initial payment in one database transaction.
2. **Subscription Renewal (`POST /subscriptions`):** Creates the renewal subscription and its associated payment in one database transaction.

There is **no standalone `POST /payments` endpoint**. Payment creation is permanently coupled with subscription creation in the same transaction. If either operation fails, the transaction is rolled back.

### 9.1 Get All Payments

**GET** `/payments`

Returns all payment tracking records for administrative audit.

**Success Response — 200 OK:**
```json
[
  {
    "id": 1,
    "userId": 15,
    "userName": "Ahmed Ali",
    "subscriptionId": 1,
    "amount": 80.00,
    "paymentDate": "2026-11-26",
    "paymentStatus": "PAID",
    "createdAt": "2026-11-26T09:00:00"
  }
]
```

---

### 9.2 Get Payment by ID

**GET** `/payments/{id}`

**Success Response — 200 OK:**
```json
{
  "id": 1,
  "userId": 15,
  "userName": "Ahmed Ali",
  "subscriptionId": 1,
  "amount": 80.00,
  "paymentDate": "2026-11-26",
  "paymentStatus": "PAID",
  "createdAt": "2026-11-26T09:00:00"
}
```

---

### 9.3 Get Payment by Subscription ID

**GET** `/payments/subscription/{subscriptionId}`

**Success Response — 200 OK:**
```json
{
  "id": 1,
  "userId": 15,
  "userName": "Ahmed Ali",
  "subscriptionId": 1,
  "amount": 80.00,
  "paymentDate": "2026-11-26",
  "paymentStatus": "PAID",
  "createdAt": "2026-11-26T09:00:00"
}
```

---

## 10. Gym Class Endpoints

Handled by: `GymClassServlet` (`/api/classes/*`)

### 10.1 Get Classes (Public / Member Schedule / Admin)

**GET** `/classes`  
**Access:** Public (Unauthenticated), Member (`MEMBER`), or Administrator (`ADMIN`)

**Query Parameters:**
- `status`: Optional filter (`SCHEDULED`, `CANCELLED`, `COMPLETED`, or `ALL`). Default when omitted for Public/Member: returns only `SCHEDULED` classes. Passing `?status=ALL` (Admin only) returns all statuses.
- `includePast`: (Boolean, optional). Default: `false`. When `true` (Admin only), returns classes regardless of whether their scheduled date/time has passed.

Returns scheduled gym classes.

**Success Response — 200 OK:**
```json
[
  {
    "id": 1,
    "name": "Morning HIIT",
    "description": "High-intensity interval training for stamina and strength",
    "trainerId": 1,
    "trainerName": "John Smith",
    "classDate": "2026-11-28",
    "startTime": "10:00:00",
    "endTime": "11:00:00",
    "capacity": 20,
    "activeBookingsCount": 8,
    "status": "SCHEDULED",
    "isBookable": true
  }
]
```

*Bookable Evaluation (Decision 6):*
A class has `isBookable: true` only if BOTH conditions hold:
1. `status == 'SCHEDULED'`
2. `classDate > CURRENT_DATE || (classDate == CURRENT_DATE && startTime > CURRENT_TIME)`

---

### 10.2 Get Class Details

**GET** `/classes/{id}`  
**Access:** Public

---

### 10.3 Create Gym Class

**POST** `/classes`  
**Access:** Administrator only (`ADMIN`)

**Request Body:**
```json
{
  "name": "Evening Power Yoga",
  "description": "Vinyasa flow focusing on balance and mobility",
  "trainerId": 1,
  "classDate": "2026-11-29",
  "startTime": "18:00:00",
  "endTime": "19:00:00",
  "capacity": 15
}
```

**Success Response — 201 Created:**
```json
{
  "message": "Class created successfully",
  "class": {
    "id": 2,
    "name": "Evening Power Yoga",
    "trainerId": 1,
    "classDate": "2026-11-29",
    "startTime": "18:00:00",
    "endTime": "19:00:00",
    "capacity": 15,
    "status": "SCHEDULED"
  }
}
```

---

### 10.4 Update Gym Class

**PUT** `/classes/{id}`  
**Access:** Administrator only (`ADMIN`)

**Request Body:**
```json
{
  "name": "Evening Power Yoga (Advanced)",
  "description": "Updated flow focusing on balance and stamina",
  "trainerId": 1,
  "classDate": "2026-11-29",
  "startTime": "18:30:00",
  "endTime": "19:30:00",
  "capacity": 18
}
```

**Success Response — 200 OK:**
```json
{
  "message": "Class updated successfully",
  "class": {
    "id": 2,
    "name": "Evening Power Yoga (Advanced)",
    "trainerId": 1,
    "classDate": "2026-11-29",
    "startTime": "18:30:00",
    "endTime": "19:30:00",
    "capacity": 18,
    "status": "SCHEDULED"
  }
}
```

---

### 10.5 Cancel Class

**PUT** `/classes/{id}/cancel`  
**Access:** Administrator only (`ADMIN`)

Sets class status to `CANCELLED`. Bookings are preserved with their history.

---

### 10.6 Complete Class

**PUT** `/classes/{id}/complete`  
**Access:** Administrator only (`ADMIN`)

Sets class status to `COMPLETED`.

---

## 11. Class Booking Endpoints

Handled by: `BookingServlet` (`/api/bookings/*`)

### 11.1 Book a Class

**POST** `/bookings`  
**Access:** Member only (`MEMBER`)

**Request Body:**
```json
{
  "classId": 1
}
```

**Backend Enforcement (Strict Transactional Concurrency Sequence):**
To completely eliminate race conditions, duplicate active bookings, and capacity overselling caused by simultaneous requests, the Java backend executes the following **exact 8-step sequence** inside a database transaction:

1. **Begin Transaction:** Start transaction with `connection.setAutoCommit(false)`.
2. **Lock Class Row:** Immediately acquire an exclusive row-level lock on the targeted class row:
   ```sql
   SELECT id, capacity, status, class_date, start_time 
   FROM gym_classes 
   WHERE id = ? 
   FOR UPDATE
   ```
   *Crucial:* Locking the class row **first** serializes all concurrent booking attempts for this class, guaranteeing that subsequent duplicate-booking and capacity calculations are strictly isolated.
3. **Check Subscription Validity:** Dynamically verify that the authenticated member has an active subscription:
   ```sql
   SELECT id FROM subscriptions 
   WHERE user_id = ? AND status = 'ACTIVE' AND CURRENT_DATE BETWEEN start_date AND end_date
   ```
   If no valid subscription is found, rollback and return `403 Forbidden` (`SUBSCRIPTION_REQUIRED`).
4. **Check Class Bookability:** Verify that the locked class has `status = 'SCHEDULED'` and that its scheduled start has not passed:
   ```sql
   class_date > CURRENT_DATE OR (class_date = CURRENT_DATE AND start_time > CURRENT_TIME)
   ```
   If the class is cancelled, completed, or in the past, rollback and return `400 Bad Request` (`CLASS_NOT_BOOKABLE`).
5. **Check Existing Active Booking:** Check if this member already has an active (`BOOKED`) booking for this class:
   ```sql
   SELECT COUNT(*) FROM bookings 
   WHERE user_id = ? AND class_id = ? AND status = 'BOOKED'
   ```
   If count > 0, rollback and return `409 Conflict` (`DUPLICATE_BOOKING`).
6. **Check Available Capacity:** Count total active bookings for this class and verify against capacity:
   ```sql
   SELECT COUNT(*) FROM bookings 
   WHERE class_id = ? AND status = 'BOOKED'
   ```
   If `activeBookingsCount >= capacity`, rollback and return `409 Conflict` (`CLASS_FULL`).
7. **Insert New Booking:** Insert a new booking record with status `BOOKED`:
   ```sql
   INSERT INTO bookings (user_id, class_id, status) VALUES (?, ?, 'BOOKED')
   ```
   *(A new record is inserted even if the member previously cancelled, preserving complete booking history).*
8. **Commit Transaction:** Commit the transaction with `connection.commit()`, releasing the row lock.

**Success Response — 201 Created:**
```json
{
  "message": "Class booked successfully",
  "booking": {
    "id": 5,
    "classId": 1,
    "bookingDate": "2026-11-26T14:30:00",
    "status": "BOOKED"
  }
}
```

---

### 11.2 Get My Bookings

**GET** `/bookings/my`  
**Access:** Member only (`MEMBER`)

Returns the authenticated member's booking history, including active (`BOOKED`) and historical (`CANCELLED`) records.

**Success Response — 200 OK:**
```json
[
  {
    "id": 5,
    "classId": 1,
    "className": "Morning HIIT",
    "trainerName": "John Smith",
    "classDate": "2026-11-28",
    "startTime": "10:00:00",
    "endTime": "11:00:00",
    "bookingDate": "2026-11-26T14:30:00",
    "status": "BOOKED"
  }
]
```

---

### 11.3 Cancel Booking

**PUT** `/bookings/{id}/cancel`  
**Access:** Member (own booking) or Administrator (`ADMIN`)

**Backend Enforcement:**
1. Verifies booking exists.
2. If caller is `MEMBER`, verifies `booking.userId == session.user.id`. If not, returns `403 Forbidden` (`ACCESS_DENIED`).
3. Updates `status = 'CANCELLED'`.
4. The record is **never physically deleted**, preserving audit and personal booking history.
5. Cancellation immediately releases one slot of class capacity.

**Success Response — 200 OK:**
```json
{
  "message": "Booking cancelled successfully",
  "bookingId": 5,
  "status": "CANCELLED"
}
```

---

### 11.4 Get All Bookings (Admin Oversight)

**GET** `/bookings`  
**Access:** Administrator only (`ADMIN`)

Returns all bookings across all members and classes with filters (`?classId=1`, `?status=BOOKED`).

---

## 12. Standard Error Response Envelope

All API errors return a standard JSON object accompanied by the corresponding HTTP status code.

### Error Structure

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable explanation of why the request failed."
}
```

### Standard Error Codes

| HTTP Code | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request payload missing required fields or format invalid. |
| `400` | `INVALID_CURRENT_PASSWORD` | Current password verification failed. |
| `400` | `CLASS_NOT_BOOKABLE` | Class is cancelled, completed, or its scheduled time has already passed. |
| `401` | `AUTHENTICATION_REQUIRED` | Valid session cookie missing or session has expired. |
| `401` | `INVALID_CREDENTIALS` | Invalid email/password, or account is inactive. |
| `403` | `ACCESS_DENIED` | Insufficient permissions for the requested resource. |
| `403` | `SUBSCRIPTION_REQUIRED` | Member does not have a valid active subscription. |
| `404` | `RESOURCE_NOT_FOUND` | Requested entity ID does not exist. |
| `409` | `DUPLICATE_BOOKING` | Member already has an active booking for this class. |
| `409` | `CLASS_FULL` | Class capacity has been reached. |
| `409` | `EMAIL_ALREADY_EXISTS` | Email address is already in use by another user account. |
| `409` | `CANNOT_DELETE_HISTORICAL_RECORD` | Foreign key constraints prevent physical deletion; soft delete applied. |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error or database query failure. |

---

## 13. Authorization Matrix

| Resource / Endpoint | Method | Visitor | Member | Administrator |
|---|---|:---:|:---:|:---:|
| **Authentication** | | | | |
| `/auth/login` | POST | Yes | Yes | Yes |
| `/auth/me` | GET | No | Yes | Yes |
| `/auth/logout` | POST | No | Yes | Yes |
| **Profile** | | | | |
| `/users/me` | GET | No | Yes | No |
| `/users/me` | PUT | No | Yes (name/phone) | No |
| `/users/me/password` | PUT | No | Yes | No |
| **User Administration** | | | | |
| `/users` | GET, POST | No | No | Yes |
| `/users/{id}` | GET, PUT, DELETE | No | No | Yes |
| `/users/{id}/status` | PUT | No | No | Yes |
| **Trainers** | | | | |
| `/trainers` | GET | Yes | Yes | Yes |
| `/trainers/{id}` | GET | Yes | Yes | Yes |
| `/trainers` | POST | No | No | Yes |
| `/trainers/{id}` | PUT, DELETE | No | No | Yes |
| `/trainers/{id}/status` | PUT | No | No | Yes |
| **Membership Plans** | | | | |
| `/plans` | GET | Yes | Yes | Yes |
| `/plans/{id}` | GET | Yes | Yes | Yes |
| `/plans` | POST | No | No | Yes |
| `/plans/{id}` | PUT, DELETE | No | No | Yes |
| `/plans/{id}/status` | PUT | No | No | Yes |
| **Subscriptions** | | | | |
| `/subscriptions/my` | GET | No | Yes | No |
| `/subscriptions` | GET, POST | No | No | Yes |
| `/subscriptions/{id}` | GET | No | Yes (own) | Yes |
| `/subscriptions/{id}/cancel`| PUT | No | No | Yes |
| **Payments** | | | | |
| `/payments` | GET | No | No | Yes |
| `/payments/{id}` | GET | No | No | Yes |
| `/payments/subscription/{id}`| GET | No | No | Yes |
| **Gym Classes** | | | | |
| `/classes` | GET | Yes | Yes | Yes |
| `/classes/{id}` | GET | Yes | Yes | Yes |
| `/classes` | POST | No | No | Yes |
| `/classes/{id}` | PUT | No | No | Yes |
| `/classes/{id}/cancel` | PUT | No | No | Yes |
| `/classes/{id}/complete` | PUT | No | No | Yes |
| **Bookings** | | | | |
| `/bookings` | POST | No | Yes (with active sub) | No |
| `/bookings/my` | GET | No | Yes | No |
| `/bookings/{id}/cancel` | PUT | No | Yes (own) | Yes |
| `/bookings` | GET | No | No | Yes |

---

## 14. Document Status

Approved API Contract. Fully synchronized with `PROJECT_REQUIREMENTS.md`, `DATABASE_SCHEMA.md`, and `ARCHITECTURE.md`.
