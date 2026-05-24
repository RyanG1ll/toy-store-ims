# Toy Store Inventory Management System

An educational and accessible inventory management system built for a toy store environment. Developed as a Final Year Project at the University of East Anglia (UEA).

**Student:** Ryan Gill (Registration: 100416051)
**Supervisor:** Debbie Taylor

---

## About

This full-stack web application provides toy store staff and administrators with tools to manage products, suppliers, purchase orders, and stock levels. The system is built with accessibility as a core requirement, meeting WCAG 2.2 AA standards throughout, and includes features such as theme switching (light, dark, high contrast), adjustable text sizing, keyboard navigation, and screen reader support.

Key features include:

- **Dashboard** with stock level summaries, low-stock alerts, and recent activity
- **Product Management** with categories, SKU tracking, reorder levels, and age range classification
- **Supplier Management** with contact details and lead time tracking
- **Purchase Order Management** with multi-item orders, status tracking, and delivery dates
- **Demand Forecasting** using historical stock movement data
- **Notifications** for low-stock warnings and system events
- **User Authentication** with email verification, password reset, and password strength validation
- **Account Management** with profile editing and password changes
- **Admin Audit Log** recording security and data-change events across all users
- **Accessibility Settings** for theme, text size, and reduced motion preferences

---

## Tech Stack

### Frontend

- React 19
- React Router 7
- Axios (HTTP client)
- Recharts (data visualisation)
- @axe-core/react (accessibility testing in development)

### Backend

- Node.js with Express 5
- PostgreSQL (via node-postgres)
- JSON Web Tokens (authentication)
- bcryptjs (password hashing)
- Nodemailer (SMTP email)
- Helmet (security headers)
- express-validator (input validation)

### Development Tools

- Concurrently (run server and client together)
- Nodemon (auto-restart server on changes)
- Jest (testing)

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **PostgreSQL** v14 or later

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/RyanG1ll/toy-store-ims.git
cd toy-store-ims
```

### 2. Install Dependencies

Install dependencies for the root, server, and client:

```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 3. Set Up the Database

Create a PostgreSQL database and run the schema:

```bash
createdb toy_store_ims
psql -d toy_store_ims -f database/schema.sql
```

Optionally seed with sample data:

```bash
psql -d toy_store_ims -f database/seed.sql
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server/` directory:

```
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
DB_NAME=toy_store_ims

JWT_SECRET=your_jwt_secret_key

NODE_ENV=development

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Toy Store IMS" <your_email@gmail.com>
```

To generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

For email functionality, create a Gmail App Password at https://myaccount.google.com/apppasswords.

---

## Running the Application

From the project root, start both the server and client concurrently:

```bash
npm run dev
```

This runs:

- **Server** on http://localhost:5001
- **Client** on http://localhost:3000

To run them individually:

```bash
# Server only
cd server && npm run dev

# Client only
cd client && npm start
```

---

## Project Structure

```
toy-store-ims/
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       ├── components/         # Reusable components (Navbar, ProtectedRoute)
│       ├── context/            # React context (AuthContext, SettingsContext)
│       ├── pages/              # Page components
│       │   ├── Account/        # Account details and profile management
│       │   ├── Auth/           # Login, register, forgot/reset password
│       │   ├── Dashboard/      # Main dashboard
│       │   ├── Forecasting/    # Demand forecasting
│       │   ├── Notifications/  # Notification centre
│       │   ├── Orders/         # Purchase order management
│       │   ├── Products/       # Product management
│       │   ├── Settings/       # Accessibility settings
│       │   └── Suppliers/      # Supplier management
│       ├── services/           # API service layer (Axios instance)
│       └── App.js              # Root component and routing
├── server/                     # Express backend
│   ├── config/                 # Database connection
│   ├── middleware/             # Authentication middleware
│   ├── routes/                 # API route handlers
│   │   ├── account.js          # Profile, password, audit log
│   │   ├── auth.js             # Login, register, email verification
│   │   ├── categories.js       # Product categories
│   │   ├── dashboard.js        # Dashboard statistics
│   │   ├── forecasting.js      # Demand forecasting
│   │   ├── notifications.js    # System notifications
│   │   ├── orders.js           # Purchase orders
│   │   ├── products.js         # Product CRUD
│   │   └── suppliers.js        # Supplier CRUD
│   ├── utils/                  # Shared utilities (audit logging, email)
│   └── server.js               # Express app entry point
├── database/                   # SQL scripts
│   ├── schema.sql              # Table definitions and indexes
│   └── seed.sql                # Sample data
└── package.json                # Root scripts (concurrently)
```

---

## Database Schema

The PostgreSQL database uses the following tables:

- **users** — Staff and admin accounts with email verification and password reset tokens
- **suppliers** — Toy supplier contact details and lead times
- **categories** — Product category classification
- **products** — Toy inventory with SKU, pricing, stock levels, reorder points, and age ranges
- **orders** — Purchase orders with status tracking (pending, confirmed, shipped, delivered, cancelled)
- **order_items** — Individual line items within each order
- **stock_movements** — Historical stock changes for auditing and forecasting
- **notifications** — System-generated alerts (low stock, order updates)
- **audit_log** — Security and activity event log (logins, data changes, password events)

---

## Security Features

- JWT-based authentication with 24-hour token expiry
- bcrypt password hashing (cost factor 10)
- Server-side password strength validation
- Timing-attack prevention on login (dummy bcrypt comparison for non-existent accounts)
- Account enumeration protection via generic error messages
- Email verification required before login
- Secure password reset with time-limited tokens (1 hour expiry)
- Helmet security headers
- Role-based access control (admin and staff roles)
- Comprehensive audit logging of security and data events

---

## Accessibility

The application targets WCAG 2.2 AA compliance:

- Semantic HTML with ARIA labels and roles
- Full keyboard navigation with visible focus indicators
- Three colour themes: light, dark, and high contrast
- Adjustable text sizing (small, medium, large, extra large)
- Reduced motion support
- Colour contrast ratios meeting AA thresholds
- Screen reader-friendly table layouts with data-label attributes
- Skeleton loading states to minimise layout shift
- Focus management on page transitions

---

## API Endpoints

All endpoints are prefixed with `/api`.

| Area          | Method | Endpoint                        | Auth Required |
|---------------|--------|---------------------------------|---------------|
| Auth          | POST   | /auth/register                  | No            |
| Auth          | POST   | /auth/login                     | No            |
| Auth          | GET    | /auth/verify-email              | No            |
| Auth          | POST   | /auth/resend-verification       | No            |
| Auth          | POST   | /auth/check-password-strength   | No            |
| Account       | GET    | /account/me                     | Yes           |
| Account       | PUT    | /account/me                     | Yes           |
| Account       | PUT    | /account/me/password            | Yes           |
| Account       | POST   | /account/forgot-password        | No            |
| Account       | POST   | /account/reset-password         | No            |
| Account       | GET    | /account/audit-log              | Admin         |
| Dashboard     | GET    | /dashboard/stats                | Yes           |
| Products      | GET    | /products                       | Yes           |
| Products      | POST   | /products                       | Yes           |
| Products      | PUT    | /products/:id                   | Yes           |
| Products      | DELETE | /products/:id                   | Yes           |
| Categories    | GET    | /categories                     | Yes           |
| Suppliers     | GET    | /suppliers                      | Yes           |
| Suppliers     | POST   | /suppliers                      | Yes           |
| Suppliers     | PUT    | /suppliers/:id                  | Yes           |
| Suppliers     | DELETE | /suppliers/:id                  | Yes           |
| Orders        | GET    | /orders                         | Yes           |
| Orders        | POST   | /orders                         | Yes           |
| Orders        | PUT    | /orders/:id/status              | Yes           |
| Orders        | DELETE | /orders/:id                     | Yes           |
| Notifications | GET    | /notifications                  | Yes           |
| Forecasting   | GET    | /forecasting                    | Yes           |

---

## Licence

This project was developed for educational purposes as part of a BSc Final Year Project at the University of East Anglia.
