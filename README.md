# BulkCart

BulkCart is a role-based B2B wholesale platform with:
- Angular frontend (`frontend`)
- NestJS backend (`backend`)
- Mongo persistence via Mongoose
- Customer, Vendor, and Admin workflows

## What’s Implemented

- Auth + OTP signup/login flow
- Role-based dashboards
- Dedicated Customer Dashboard with customer order details
- Vendor/Admin dashboard with operational/admin controls
- Admin vendor onboarding actions:
- Approve vendor
- Decline vendor
- Vendor access is blocked until approved
- Product catalog browse/search/filter
- Product management (create/update/delete)
- Pricing/tier configuration
- Cart + checkout
- Payment intent + checkout validation flow
- Orders, order history, drafts, bulk import
- Shipments
- Spending reports
- Reorder suggestions
- Subscription tiers + commission preview
- Route-level role guards (including operations access restriction)

## Role Access Rules

- Customer:
- Can access catalog, cart, orders, customer dashboard
- Cannot access operations
- Vendor:
- Must be approved by admin before using protected app pages
- Admin:
- Can approve/decline pending vendors
- Can access admin dashboard and operations

## Repository Structure

- `frontend`: Angular application
- `backend`: NestJS API
- `docker-compose.yml`: Optional container setup (if Docker is available)

## Prerequisites

- Node.js 20.x recommended
- npm 10+
- No local MongoDB required if `USE_IN_MEMORY_DB=true` in backend env

## Environment Setup

Root `.env` (already present in project):
- `MONGO_URI=mongodb://localhost:27017/bulkcart_dev`
- `PORT=3000`
- SMTP settings for OTP email delivery

Backend env (`backend/.env`) should include:
- `MONGO_URI=mongodb://mongo:27017/bulkcart_dev`
- `USE_IN_MEMORY_DB=true`
- `PORT=3000`
- `NODE_ENV=development`

With `USE_IN_MEMORY_DB=true`, backend can run APIs locally without Docker Mongo.

## Run Locally

### 1) Backend

```bash
cd backend
npm install
npm run start:dev
```

Backend API base URL:
- `http://localhost:3000/api`

Health check:
```bash
curl http://localhost:3000/api/health
```

### 2) Frontend

```bash
cd frontend
npm install
npm start
```

Frontend URL:
- `http://localhost:4200`

Frontend calls backend at:
- `http://localhost:3000/api`

## Build Commands

Backend:
```bash
cd backend
npm run build
```

Frontend:
```bash
cd frontend
npm run build
```

## Demo Credentials

- Customer:
- `demo@restaurant.com` / `demo123`
- Vendor:
- `demo@supplier.com` / `demo123`
- Admin:
- `admin@bulkcart.com` / `admin123`

## OTP Behavior

- `POST /api/auth/request-otp` sends email OTP if SMTP works
- If SMTP delivery fails, backend returns `devOtp` in response for development
- `POST /api/auth/verify-otp` returns `verificationToken`
- `verificationToken` is required for signup

## Key API Endpoints

Auth:
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`

Catalog:
- `GET /api/products`
- `POST /api/products/manage`
- `DELETE /api/products/manage/:productId`
- `POST /api/products/pricing`

Cart/Payment/Checkout:
- `GET /api/cart/:userId`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `POST /api/payments/create-intent`
- `POST /api/cart/checkout`

Orders:
- `GET /api/orders`
- `GET /api/orders/:orderId/history`
- `POST /api/orders/drafts`
- `PATCH /api/orders/drafts/:draftId`
- `GET /api/orders/drafts/:draftId`
- `POST /api/orders/drafts/:draftId/submit`
- `POST /api/orders/bulk-import`

Shipments/Reports/Billing:
- `POST /api/shipments`
- `GET /api/shipments`
- `GET /api/reports/spending`
- `GET /api/reports/reorder-suggestions`
- `GET /api/billing/subscription-tiers`
- `POST /api/billing/subscription-tiers`
- `GET /api/billing/commission-preview`

Admin vendor actions:
- `POST /api/admin/vendors/:vendorId/approve`
- `POST /api/admin/vendors/:vendorId/decline`

## Troubleshooting

If all APIs fail in browser:
- Ensure backend is running:
```bash
cd backend
npm run start:dev
```
- Verify health endpoint:
```bash
curl http://localhost:3000/api/health
```
- Confirm frontend environment points to `http://localhost:3000/api`
- Hard refresh browser after backend restart

If OTP email is not received:
- Check SMTP credentials in `.env`
- Use `devOtp` from response while testing in dev mode

If vendor cannot log in:
- Vendor may still be pending approval
- Login as admin and approve vendor in admin dashboard

## Notes

- Frontend is configured to use real backend APIs (no dummy/fallback API mode).
- Customer dashboard is separate from vendor/admin dashboard by route and component.
- Operations route is restricted to Vendor/Admin only.
