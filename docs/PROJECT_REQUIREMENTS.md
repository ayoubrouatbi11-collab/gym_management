# FitSphere — Project Requirements

## 1. Project Overview

**Project Name:** FitSphere

**Project Description:**

FitSphere is a web-based gym management platform designed to simplify the management of gym members, trainers, membership plans, subscriptions, fitness classes, and class bookings.

The platform provides three types of users: visitors, members, and administrators. Each role has different permissions and functionalities.

The system aims to centralize gym management operations through a simple, organized, and user-friendly interface.

## 2. Project Objectives

The main objectives of FitSphere are:

- Provide visitors with information about the gym, trainers, membership plans, and available classes.
- Allow members to access their accounts and manage their gym activities.
- Allow members to browse and book available fitness classes.
- Enable administrators to manage members, trainers, plans, subscriptions, classes, payments, and bookings.
- Maintain subscription and payment history for each member.
- Prevent members without valid subscriptions from booking classes.
- Simplify daily gym management operations.

## 3. User Roles and Functional Requirements

### 3.1 Visitor

A visitor is a user who accesses the platform without logging in.

Visitors can:

- View the homepage.
- Browse gym facilities and services.
- View the list of trainers and their information.
- Browse available membership plans.
- View scheduled gym classes.
- Access the login page.

Visitors cannot:

- Create their own accounts.
- Book gym classes.
- Access member or administrator dashboards.
- Access private member information.

**Important:** FitSphere does not provide public self-registration. Member accounts are created exclusively by an administrator after payment has been received and verified physically at the gym.

### 3.2 Member

A member is a registered gym user whose account has been created by an administrator.

Members can:

- Log in and log out.
- Access their personal dashboard.
- View their profile information.
- Edit their own permitted profile fields:
  - `full_name`
  - `phone`
  - `password` through a dedicated change-password operation (verified and hashed with BCrypt on the backend).
- View their current subscription details.
- Check their subscription status and expiration date.
- Browse available gym classes.
- Book a class if they have a valid active subscription.
- View their own bookings.
- Cancel their own bookings.

Members cannot:

- Create another account.
- Edit their `email` (admin-managed login identifier).
- Edit their `role`, `account_status`, or any other protected administrative fields.
- Modify administrator-controlled information.
- Manage other members.
- Modify trainers, membership plans, or gym classes.
- Book classes without a valid active subscription.
- View or modify another member's private information.

### 3.3 Administrator

The administrator is responsible for managing the gym through a protected dashboard.

Administrators can:

**Dashboard**
- View the total number of members.
- View the number of active subscriptions.
- View scheduled classes.
- View total bookings.
- Access important management operations.

The dashboard should remain simple and focus on useful information rather than complicated charts or unnecessary analytics.

**Member Management**
- Create new member accounts and assign initial subscriptions.
- View the list of members.
- View individual member details.
- Update member information (including email, full name, phone, role, and account status).
- Deactivate member accounts (Soft Delete: setting `account_status = 'INACTIVE'`). Physical `DELETE` is prohibited for members who have historical records (subscriptions, bookings, payments).

**Trainer Management**
- Add new trainers.
- View trainers.
- Update trainer information.
- Deactivate trainers when appropriate (Soft Delete: setting `is_active = FALSE`). Physical `DELETE` is disallowed for trainers referenced by existing gym classes.

**Membership Plan Management**
- Create membership plans.
- View available plans.
- Update plan details.
- Deactivate plans when appropriate (Soft Delete: setting `is_active = FALSE`). Physical `DELETE` is disallowed for plans referenced by historical subscriptions.

**Subscription & Payment Management**
- Assign an initial subscription and record verified payment when creating a new member.
- View member subscriptions and payment history.
- Renew subscriptions for existing members.
- Maintain historical subscription and payment records.
- Manage subscription statuses.

**Class Management**
- Create gym classes.
- Assign trainers to classes.
- Set class dates, start times, end times, and capacities.
- Update class information.
- Cancel or complete classes.

**Booking Management**
- View bookings and booking details.
- Manage bookings when necessary.
- Monitor class occupancy.

## 4. Main Business Rules

### 4.1 Account Creation & Initial Subscription

- Public self-registration is not allowed.
- Only administrators can create member accounts.
- An administrator creates a member account only after receiving and verifying the payment physically at the gym.
- Creating a new member, assigning their initial subscription, and recording the verified payment happen in a single administrative workflow.
- **Mandatory Initial Subscription & Payment:** An account cannot be created without an initial subscription. Providing the plan, starting date, and verified payment is strictly mandatory.
- This initial creation operation creates **three separate database records** atomically:
  1. A `users` record (the member account).
  2. A `subscriptions` record (the assigned plan and duration).
  3. A `payments` record (the tracked manual payment).
- The member account, subscription, and payment are distinct entities.
- Each subscription can have at most one payment record; duplicate payment records for the same subscription are prohibited.
- The administrator provides the member with their login credentials (email and initial password).
- The member can immediately log in using those credentials.
- Members may change their passwords later through their profile, but changing the password on first login is not mandatory.

### 4.2 Subscription Management & Expiration

- A member can have multiple subscription records over time.
- Each subscription belongs to one member and one membership plan.
- A subscription has a start date, end date, and status.
- A subscription is considered valid only when:
  - Its status is `ACTIVE`.
  - The current date is greater than or equal to its start date.
  - The current date is less than or equal to its end date.
- Expired subscriptions must not be considered valid.
- When a subscription expires, the member account must not be deleted or disabled automatically.
- Members with expired subscriptions can still log in and access their account information.
- Members without a valid active subscription cannot book classes.

### 4.3 Subscription Renewal

- A member renews their subscription by visiting the gym and paying physically.
- The administrator verifies the physical payment.
- The administrator creates a new subscription record and associated payment record for the existing member.
- Renewal must not create a duplicate member account.
- Previous subscription and payment records must be preserved to maintain complete historical reference.

### 4.4 Manual Payment Management

- All payments are made physically at the gym.
- FitSphere does not process online payments.
- Payments are stored in the dedicated `payments` table for administrative tracking.
- Payment records are created exclusively within the initial member creation transaction (`POST /users`) and the subscription renewal transaction (`POST /subscriptions`). There is no standalone endpoint for creating payments; standalone payment creation is not supported.
- Payment information includes the member (`user_id`), associated subscription (`subscription_id`), amount received, payment date, and payment status (`PAID` or `CANCELLED`).
- Payment records are for tracking purposes only.
- The system must not collect or store bank card credentials.

### 4.5 Class Booking & Eligibility

A member can book a class only if they have a valid active subscription.

When a member attempts to book a class, the backend must verify all the following conditions:

1. The user is authenticated.
2. The user has the `MEMBER` role.
3. The member has a valid active subscription (`status = 'ACTIVE'` and `CURRENT_DATE BETWEEN start_date AND end_date`).
4. The class exists, its status is `SCHEDULED`, and its starting date and time are still in the future:
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
5. The class has remaining capacity (`COUNT(active bookings) < capacity`).
6. The member does not already have an active (`BOOKED`) booking for the same class.

If all conditions are satisfied, the booking is created.

Otherwise, the system returns an appropriate error message:
- `Active subscription required.`
- `Class is full.`
- `You have already booked this class.`
- `Class is not available for booking.`

This validation must be enforced by the Java backend, not only the React frontend.

### 4.6 Booking Cancellation & History

- Members can cancel only their own bookings.
- Cancelling a booking updates its status to `CANCELLED`. It is never deleted.
- Cancelling releases the reserved class capacity.
- If a member books the same class again after cancelling, a new booking record is created (`INSERT`), preserving the previous cancellation as booking history.
- The backend prevents multiple active (`BOOKED`) bookings for the same member and class using transactional concurrency control.

### 4.7 Deletion Policy (Soft Delete)

- Deleting a member deactivates the account (`account_status = 'INACTIVE'`).
- Deleting a trainer deactivates the trainer (`is_active = FALSE`).
- Deleting a membership plan deactivates the plan (`is_active = FALSE`).
- Physical SQL `DELETE` is prohibited on records referenced by foreign keys (subscriptions, classes, bookings, payments).

## 5. Dashboard Requirements

### 5.1 Member Dashboard

The member dashboard should be simple and contain:

- A welcome message.
- A membership card displaying the current plan, subscription status, and expiration date.
- A small overview of upcoming bookings and subscription information.
- A list of upcoming booked classes.
- A quick action to browse available classes.

The member dashboard should provide quick access to:
- Dashboard
- Classes
- My Bookings
- My Subscription
- My Profile
- Logout

### 5.2 Administrator Dashboard

The administrator dashboard should contain:

- **Total members:** Total count of active registered gym members (`role = 'MEMBER'` and `account_status = 'ACTIVE'`).
- **Active subscriptions:** Total count of currently valid subscriptions (`status = 'ACTIVE'` and `CURRENT_DATE BETWEEN start_date AND end_date`).
- **Scheduled classes:** Count of future gym sessions with status `SCHEDULED`.
- **Total bookings:** Count of active reservations (`status = 'BOOKED'`).
- A list of recently added members.
- A list of upcoming classes.
- Quick access to important management operations, especially creating a new member with initial subscription and payment.

The administrator dashboard should prioritize clarity and simplicity. Complex charts, advanced analytics, and unnecessary dashboard features are outside the initial project scope.

## 6. Non-Functional Requirements

### 6.1 Security

- Passwords must be securely hashed using BCrypt. Minimum password length is 6 characters without whitespace.
- Authentication must be implemented using HTTP sessions.
- Protected operations must require authentication.
- Role-based authorization must be enforced by the backend.
- Members must only access and modify their own private information and bookings.
- Database queries must use prepared statements to eliminate SQL injection risks.
- Sensitive configuration and database credentials must not be hardcoded or committed to Git.

### 6.2 Performance and Reliability

- The application should respond efficiently to normal user operations.
- Booking operations must prevent overbooking and duplicate bookings via database transactions.
- Database operations involving related records (e.g. member + subscription + payment) must use transactions to maintain consistency.
- Errors must be handled properly and return meaningful responses.

### 6.3 Usability

- The interface should be simple, clear, and responsive.
- Each role should have an interface adapted to its responsibilities.
- Navigation should be consistent and easy to understand.
- Error and success messages should clearly explain the result of user actions.

### 6.4 Maintainability

- The application should follow a clear separation between frontend, backend, and database responsibilities.
- Shared functionality should not be unnecessarily duplicated.
- The codebase should be organized into reusable components and logical modules.
- API communication should follow consistent request and response formats.

## 7. Technology Stack and Technical Constraints

### Frontend
- React.js
- JavaScript
- Vite
- React Router
- CSS
- Fetch API

### Backend
- Java 17
- Java Servlets (Jakarta Servlet 6.0)
- JDBC
- Apache Tomcat 10.1
- Maven
- Gson
- BCrypt

### Database
- MySQL
- MySQL Connector/J
- InnoDB storage engine
- Foreign key constraints
- Transactions where necessary

### Authentication
- HTTP sessions.
- Role-based access control.
- CORS configured to allow the frontend origin and credentials.

The frontend must include session credentials (`credentials: "include"`) in requests to protected backend endpoints.

### Architecture Constraints
- The project must use a REST-style API with JSON communication.
- The backend must use Jakarta Servlet APIs compatible with Tomcat 10.1.
- Spring Boot must not be used.
- JSP must not be used.
- Node.js must not be used as the backend.
- TypeScript is not part of the current frontend stack.

## 8. Features Outside the Initial Project Scope

The following features are not included in the initial version:
- Public member registration.
- Online payment processing.
- Bank card storage or processing.
- Automatic account deletion after subscription expiration.
- Complex business analytics and reporting.
- Advanced notification systems.
- Unnecessary third-party integrations.

Any additional feature must be discussed and approved before being added to the project scope.

## 9. Related Documentation

| Document | Purpose |
|---|---|
| `DATABASE_SCHEMA.md` | Database tables, fields, relationships, and constraints. |
| `ARCHITECTURE.md` | Frontend, backend, and database architecture. |
| `API_CONTRACT.md` | API endpoints, HTTP methods, requests, responses, and status codes. |
| `TASKS.md` | Development tasks and team responsibilities. |
| `DEVELOPMENT_WORKFLOW.md` | Git collaboration and development workflow. |
| `PROJECT_CONTEXT.md` | Central project reference for AI coding agents. |
